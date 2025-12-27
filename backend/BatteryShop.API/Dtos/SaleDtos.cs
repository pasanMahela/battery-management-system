namespace BatteryShop.API.Dtos;

public record SaleCreateDto(
    string CustomerName,
    string CustomerPhone,
    string CustomerId,
    decimal Discount,
    List<SaleItemDto> Items
);

public record SaleItemDto(
    string BatteryId,
    int Quantity
);
