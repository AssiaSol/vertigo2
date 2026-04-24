using Microsoft.EntityFrameworkCore;

namespace Vertigo.Models
{

    [Owned]
    public class Evaluation
    {
        public int NbNote { get; set; } = 0;
        public double Note { get; set; } = 0.0;
    }

    public static class BasketTypes
    {
        public const string NS = "";
        public const string Bakery = "Bakery Basket";
        public const string Food = "Food Basket";
        public const string Grocery = "Grocery Basket";
        public const string Surprise = "Surprise Basket";
    }
}


