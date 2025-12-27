using BatteryShop.API.Dtos;
using BatteryShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BatteryShop.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Require authentication for all endpoints
public class BatteryController : ControllerBase
{
    private readonly BatteryService _batteryService;

    public BatteryController(BatteryService batteryService)
    {
        _batteryService = batteryService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Cashier")] // Allow both Admin and Cashier to read
    public async Task<IActionResult> GetAll()
    {
        var batteries = await _batteryService.GetAllAsync();
        return Ok(batteries);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Cashier")] // Allow both Admin and Cashier to read
    public async Task<IActionResult> GetById(string id)
    {
        var battery = await _batteryService.GetByIdAsync(id);
        if (battery == null) return NotFound();
        return Ok(battery);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")] // Only Admin can create
    public async Task<IActionResult> Create(BatteryCreateDto dto)
    {
        var battery = await _batteryService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = battery.Id }, battery);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")] // Only Admin can update
    public async Task<IActionResult> Update(string id, BatteryUpdateDto dto)
    {
        var success = await _batteryService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // Only Admin can delete
    public async Task<IActionResult> Delete(string id)
    {
        var success = await _batteryService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
