# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (cached layer) then copy the rest and publish.
COPY Vertigo.csproj ./
RUN dotnet restore Vertigo.csproj
COPY . ./
RUN dotnet publish Vertigo.csproj -c Release -o /app /p:UseAppHost=false

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

ENV ASPNETCORE_ENVIRONMENT=Production
# Render injects $PORT at runtime; Program.cs reads it and binds dynamically.
# This default just lets `docker run -p 8080:8080` work locally.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Vertigo.dll"]
