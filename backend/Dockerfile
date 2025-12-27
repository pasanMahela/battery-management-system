FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["BatteryShop.API/BatteryShop.API.csproj", "BatteryShop.API/"]
RUN dotnet restore "BatteryShop.API/BatteryShop.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/BatteryShop.API"
RUN dotnet build "BatteryShop.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BatteryShop.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port (Render uses PORT environment variable)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "BatteryShop.API.dll"]
