using BatteryShop.API.Dtos;
using BatteryShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BatteryShop.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SaleController : ControllerBase
{
    private readonly SaleService _saleService;

    public SaleController(SaleService saleService)
    {
        _saleService = saleService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var sales = await _saleService.GetAllAsync();
        return Ok(sales);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var sale = await _saleService.GetByIdAsync(id);
        if (sale == null) return NotFound();
        return Ok(sale);
    }

    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> SearchCustomers(string customerId)
    {
        var sales = await _saleService.SearchByCustomerIdAsync(customerId);
        
        // Get unique customers based on CustomerId
        var customers = sales
            .GroupBy(s => s.CustomerId)
            .Select(g => g.First())
            .Select(s => new { 
                customerId = s.CustomerId, 
                customerName = s.CustomerName, 
                customerPhone = s.CustomerPhone,
                lastPurchase = s.Date
            })
            .ToList();
        
        return Ok(customers);
    }

    [HttpGet("customer/phone/{phoneNumber}")]
    public async Task<IActionResult> SearchCustomersByPhone(string phoneNumber)
    {
        var sales = await _saleService.SearchByPhoneAsync(phoneNumber);
        
        // Get unique customers based on Phone Number
        var customers = sales
            .GroupBy(s => s.CustomerPhone)
            .Select(g => g.First())
            .Select(s => new { 
                customerId = s.CustomerId, 
                customerName = s.CustomerName, 
                customerPhone = s.CustomerPhone,
                lastPurchase = s.Date
            })
            .ToList();
        
        return Ok(customers);
    }

    [HttpPost]
    public async Task<IActionResult> Create(SaleCreateDto dto)
    {
        var cashierId = User.FindFirst("id")?.Value ?? "";
        var cashierName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";

        try
        {
            var sale = await _saleService.CreateAsync(dto, cashierId, cashierName);
            return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
