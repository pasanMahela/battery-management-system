namespace BatteryShop.API.Dtos;

public record BatteryCreateDto(
    string SerialNumber,
    string? Barcode,
    string Brand,
    string Model,
    double Capacity,
    double Voltage,
    decimal PurchasePrice,
    decimal SellingPrice,
    DateTime PurchaseDate,
    int StockQuantity,
    int WarrantyPeriodMonths,
    int ShelfLifeMonths
);

public record BatteryUpdateDto(
    string SerialNumber,
    string? Barcode,
    string Brand,
    string Model,
    double Capacity,
    double Voltage,
    decimal PurchasePrice,
    decimal SellingPrice,
    DateTime PurchaseDate,
    int StockQuantity,
    int WarrantyPeriodMonths,
    int ShelfLifeMonths
);
