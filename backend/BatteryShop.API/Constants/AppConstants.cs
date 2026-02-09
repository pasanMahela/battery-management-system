namespace BatteryShop.API.Constants;

public static class AppConstants
{
    public static class Collections
    {
        public const string Batteries = "Batteries";
        public const string Sales = "Sales";
        public const string Users = "Users";
        public const string Counters = "Counters";
        public const string BatteryReturns = "BatteryReturns";
        public const string ActivityLogs = "ActivityLogs";
    }

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Cashier = "Cashier";
    }

    public static class Defaults
    {
        public const int PageSize = 50;
        public const int SearchLimit = 20;
        public const int BcryptWorkFactor = 12;
        public const int DefaultJwtExpiryDays = 7;
        public const string InvoicePrefix = "INV";
    }

    public static class ReturnTypes
    {
        public const string Money = "Money";
        public const string Replacement = "Replacement";
    }

    public static class ReturnStatuses
    {
        public const string Pending = "Pending";
        public const string Completed = "Completed";
    }
}
