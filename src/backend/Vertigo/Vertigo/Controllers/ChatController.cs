using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Vertigo.Controllers
{
    // Proxies the public chatbot to Groq so the API key stays on the server and
    // never ships in the browser bundle. The frontend sends the conversation
    // (including its localized system prompt); we add the key and forward it.
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        public ChatController(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        public record ChatMessage(string Role, string Content);
        public record ChatRequest(List<ChatMessage> Messages);

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ChatRequest request)
        {
            // Set Groq:ApiKey in config or the GROQ_API_KEY env var (Render).
            var apiKey = _config["Groq:ApiKey"]
                ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(503, new { message = "Chat service is not configured." });

            if (request?.Messages is null || request.Messages.Count == 0)
                return BadRequest(new { message = "No messages provided." });

            var payload = new
            {
                model = "llama-3.3-70b-versatile",
                temperature = 0.6,
                max_tokens = 1024,
                messages = request.Messages.Select(m => new { role = m.Role, content = m.Content }),
            };

            var client = _httpClientFactory.CreateClient();
            using var req = new HttpRequestMessage(
                HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            req.Content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var resp = await client.SendAsync(req);
            var body = await resp.Content.ReadAsStringAsync();

            if (!resp.IsSuccessStatusCode)
                return StatusCode((int)resp.StatusCode, new { message = "Upstream chat error." });

            using var doc = JsonDocument.Parse(body);
            var reply = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "";

            return Ok(new { reply });
        }
    }
}
