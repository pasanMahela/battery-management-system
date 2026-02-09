namespace BatteryShop.API.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string entityName, string id) : base($"{entityName} with ID '{id}' was not found.") { }
}

public class DuplicateException : Exception
{
    public DuplicateException(string message) : base(message) { }
    public DuplicateException(string entityName, string field, string value) 
        : base($"{entityName} with {field} '{value}' already exists.") { }
}

public class InsufficientStockException : Exception
{
    public string BatteryId { get; }
    public int RequestedQuantity { get; }
    public int AvailableQuantity { get; }

    public InsufficientStockException(string batteryId, int requested, int available) 
        : base($"Insufficient stock for battery {batteryId}. Requested: {requested}, Available: {available}")
    {
        BatteryId = batteryId;
        RequestedQuantity = requested;
        AvailableQuantity = available;
    }
}

public class ValidationException : Exception
{
    public Dictionary<string, string[]> Errors { get; }

    public ValidationException(string message) : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(Dictionary<string, string[]> errors) 
        : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }
}

public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message) { }
}

public class AlreadyReturnedException : BusinessRuleException
{
    public AlreadyReturnedException(string batteryId) 
        : base($"Battery with ID '{batteryId}' has already been returned.") { }
}

public class DependencyException : BusinessRuleException
{
    public DependencyException(string message) : base(message) { }
}


