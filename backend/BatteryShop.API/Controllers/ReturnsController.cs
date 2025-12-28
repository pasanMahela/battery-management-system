using BatteryShop.API.Dtos;
using BatteryShop.API.Models;
using BatteryShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BatteryShop.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReturnsController : ControllerBase
{
    private readonly BatteryReturnService _returnService;
    private readonly BatteryService _batteryService;

    public ReturnsController(BatteryReturnService returnService, BatteryService batteryService)
    {
        _returnService = returnService;
        _batteryService = batteryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BatteryReturn>>> GetAll()
    {
        var returns = await _returnService.GetAllAsync();
        return Ok(returns);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BatteryReturn>> GetById(string id)
    {
        var batteryReturn = await _returnService.GetByIdAsync(id);
        if (batteryReturn == null)
            return NotFound();
        return Ok(batteryReturn);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<BatteryReturn>> Create(BatteryReturnCreateDto dto)
    {
        try
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            
            // If compensation is replacement, add new battery to inventory
            if (dto.CompensationType == "Replacement" && !string.IsNullOrEmpty(dto.ReplacementSerialNumber))
            {
                var newBattery = await _batteryService.CreateAsync(new BatteryCreateDto(
                    SerialNumber: dto.ReplacementSerialNumber!,
                    Barcode: dto.ReplacementBarcode,
                    Brand: dto.ReplacementBrand!,
                    Model: dto.ReplacementModel!,
                    Capacity: double.TryParse(dto.ReplacementCapacity, out var cap) ? cap : 0,
                    Voltage: dto.ReplacementVoltage ?? 12,
                    PurchasePrice: dto.ReplacementPurchasePrice ?? 0,
                    SellingPrice: dto.ReplacementSellingPrice ?? 0,
                    PurchaseDate: dto.ReplacementPurchaseDate ?? DateTime.UtcNow,
                    StockQuantity: dto.ReplacementStockQuantity ?? 1,
                    WarrantyPeriodMonths: dto.ReplacementWarrantyPeriodMonths ?? 12,
                    ShelfLifeMonths: dto.ReplacementShelfLifeMonths ?? 24,
                    SalesRep: dto.ReplacementSalesRep,
                    InvoiceNumber: dto.ReplacementInvoiceNumber
                ));
                
                // Create return record
                var batteryReturn = await _returnService.CreateAsync(dto, username);
                
                // Update the return with replacement battery details and mark as completed
                await _returnService.UpdateStatusAsync(batteryReturn.Id!, new BatteryReturnUpdateDto 
                { 
                    Status = "Completed", 
                    Notes = batteryReturn.Notes 
                });
                
                // Update replacement battery details including serial number, sales rep, and invoice number
                await _returnService.SetReplacementDetailsAsync(
                    batteryReturn.Id!, 
                    newBattery.Id!, 
                    newBattery.SerialNumber,
                    dto.ReplacementSalesRep,
                    dto.ReplacementInvoiceNumber
                );
                
                return CreatedAtAction(nameof(GetById), new { id = batteryReturn.Id }, batteryReturn);
            }
            else
            {
                var batteryReturn = await _returnService.CreateAsync(dto, username);
                return CreatedAtAction(nameof(GetById), new { id = batteryReturn.Id }, batteryReturn);
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, BatteryReturnUpdateDto dto)
    {
        var success = await _returnService.UpdateStatusAsync(id, dto);
        if (!success)
            return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var success = await _returnService.DeleteAsync(id);
        if (!success)
            return NotFound();
        return NoContent();
    }
}
