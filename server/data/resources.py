# Seed data for the fleet. Each row is a single physical car (capacity=1) — see
# booking-model.md's "capacity > 1" note on why identical units get their own row
# rather than a shared capacity counter.
RESOURCES = [
    {
        "id": 1,
        "name": "Toyota Camry",
        "category": "Sedan",
        "description": "Comfortable mid-size sedan, great for city driving and highway trips.",
        "image": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800",
        "price": 45.00,
        "capacity": 1,
        "metadata": {
            "make": "Toyota", "model": "Camry", "year": 2023, "licensePlate": "CR-1001",
            "seats": 5, "transmission": "Automatic", "fuelType": "Petrol", "location": "Downtown Depot",
        },
    },
    {
        "id": 2,
        "name": "Honda CR-V",
        "category": "SUV",
        "description": "Spacious SUV with plenty of cargo room, ideal for family trips.",
        "image": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        "price": 65.00,
        "capacity": 1,
        "metadata": {
            "make": "Honda", "model": "CR-V", "year": 2022, "licensePlate": "CR-1002",
            "seats": 5, "transmission": "Automatic", "fuelType": "Petrol", "location": "Airport Depot",
        },
    },
    {
        "id": 3,
        "name": "Volkswagen Golf",
        "category": "Hatchback",
        "description": "Compact and fuel-efficient hatchback, easy to park in the city.",
        "image": "https://images.unsplash.com/photo-1600661653561-629509216228?w=800",
        "price": 38.00,
        "capacity": 1,
        "metadata": {
            "make": "Volkswagen", "model": "Golf", "year": 2021, "licensePlate": "CR-1003",
            "seats": 5, "transmission": "Manual", "fuelType": "Petrol", "location": "Downtown Depot",
        },
    },
    {
        "id": 4,
        "name": "Ford F-150",
        "category": "Truck",
        "description": "Full-size pickup truck with a large bed, great for moving and hauling.",
        "image": "https://images.unsplash.com/photo-1595758228888-373eb1d654a1?w=800",
        "price": 80.00,
        "capacity": 1,
        "metadata": {
            "make": "Ford", "model": "F-150", "year": 2023, "licensePlate": "CR-1004",
            "seats": 5, "transmission": "Automatic", "fuelType": "Petrol", "location": "Airport Depot",
        },
    },
    {
        "id": 5,
        "name": "Mazda MX-5",
        "category": "Convertible",
        "description": "Sporty two-seat convertible, perfect for a weekend drive.",
        "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
        "price": 95.00,
        "capacity": 1,
        "metadata": {
            "make": "Mazda", "model": "MX-5", "year": 2022, "licensePlate": "CR-1005",
            "seats": 2, "transmission": "Manual", "fuelType": "Petrol", "location": "Downtown Depot",
        },
    },
    {
        "id": 6,
        "name": "Tesla Model 3",
        "category": "Electric",
        "description": "All-electric sedan with autopilot and long range.",
        "image": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800",
        "price": 90.00,
        "capacity": 1,
        "metadata": {
            "make": "Tesla", "model": "Model 3", "year": 2024, "licensePlate": "CR-1006",
            "seats": 5, "transmission": "Automatic", "fuelType": "Electric", "location": "Downtown Depot",
        },
    },
]
