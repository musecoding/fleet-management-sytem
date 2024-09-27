# Fleet Management System - Azle Project

## Overview

This is a decentralized fleet management system built using Azle. The project provides functionality to manage drivers, vehicles, bookings, fuel consumption, maintenance, emergency assistance, and optimized routes.

The project leverages the power of stable BTreeMap storage to persist data related to drivers, vehicles, and bookings.

## Features

1. **Driver Management**:
    - Create, retrieve, and manage driver details such as name, license number, and contact information.
    - Each driver is associated with a unique principal (owner) and has a points system to track performance.

2. **Vehicle Management**:
    - Add and manage vehicles, including details such as registration number, model, capacity, location, and status (Available, Booked, Maintenance).
    - Retrieve vehicles by ID, registration number, or model.

3. **Booking System**:
    - Create and manage bookings for vehicles and drivers.
    - Track bookings based on the vehicle or driver and ensure that vehicles are available before booking.

4. **Fuel Consumption**:
    - Record and retrieve fuel consumption for vehicles, with details on the date and amount of fuel consumed.

5. **Maintenance**:
    - Schedule and manage vehicle maintenance records, tracking the description, scheduled date, and status.

6. **Emergency Assistance**:
    - Record and retrieve emergency assistance requests for vehicles, including details of the location and description of the emergency.

7. **Route Optimization**:
    - Create optimized routes between two locations, estimating distance and travel time.

## Technologies

- **Azle**: A framework for developing Internet Computer canisters using TypeScript and stable BTreeMaps for data persistence.
- **UUID**: Used to generate unique IDs for drivers, vehicles, bookings, etc.
- **Principal**: Internet Computer's unique identifier for users.
- **BTreeMap**: A stable storage map for storing key-value pairs in a persistent manner.

## Project Structure

- **Driver Management**: Code for creating, retrieving, and managing drivers.
- **Vehicle Management**: Code for adding, retrieving, and managing vehicle information.
- **Booking System**: Code for booking vehicles and assigning drivers.
- **Fuel Consumption**: Code for tracking vehicle fuel usage.
- **Maintenance System**: Code for scheduling and managing vehicle maintenance.
- **Emergency Assistance**: Code for requesting emergency assistance.
- **Route Management**: Code for generating and optimizing routes.

## Usage

1. **Create Driver**:
   - Use the `createDriver` method to add a new driver to the system. Ensure that all required fields (name, license number, contact information) are provided.
   
2. **Create Vehicle**:
   - Add a new vehicle by using the `createVehicle` method. Provide all necessary vehicle details, including registration number, model, capacity, and location.
   
3. **Create Booking**:
   - To book a vehicle, use the `createBooking` method. The system will check if the vehicle is available and if the driver is valid before processing the booking.
   
4. **Record Fuel Consumption**:
   - Record fuel consumption for a vehicle by using the `recordFuelConsumption` method, including the amount and the date.

5. **Schedule Maintenance**:
   - Schedule maintenance for a vehicle using the `scheduleMaintenance` method. Provide a description and the scheduled date for the maintenance.

6. **Request Emergency Assistance**:
   - Use the `requestEmergencyAssistance` method to log an emergency assistance request for a vehicle, with location and description.

