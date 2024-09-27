import {
  query,
  update,
  text,
  Null,
  Record,
  StableBTreeMap,
  Variant,
  Vec,
  Principal,
  Ok,
  Err,
  ic,
  Result,
  nat64,
  Canister,
} from "azle";
import { v4 as uuidv4 } from "uuid";
// Roles Enumeration
const UserRole = Variant({
  User: Null,
  Admin: Null,
  Manager: Null,
  Driver: Null,
});

// Vehicle Status Enumeration
const VehicleStatus = Variant({
  Available: Null,
  Booked: Null,
  Maintenance: Null,
});

// Driver struct
const Driver = Record({
  id: text,
  owner: Principal,
  name: text,
  license_number: text,
  contact_info: text,
  points: nat64,
  created_at: nat64,
});

// Vehicle struct
const Vehicle = Record({
  id: text,
  registration_number: text,
  model: text,
  capacity: nat64,
  status: VehicleStatus,
  location: text,
  created_at: nat64,
});

// Booking struct
const Booking = Record({
  id: text,
  vehicle_id: text,
  driver_id: text,
  from_location: text,
  to_location: text,
  start_time: nat64,
  end_time: nat64,
  status: text,
  created_at: nat64,
});

// Fuel Consumption struct
const FuelConsumption = Record({
  id: text,
  vehicle_id: text,
  amount: text,
  date: nat64,
});

// Maintenance struct
const Maintenance = Record({
  id: text,
  vehicle_id: text,
  description: text,
  scheduled_date: nat64,
  status: text,
  created_at: nat64,
});

// Emergency Assistance struct
const EmergencyAssistance = Record({
  id: text,
  vehicle_id: text,
  description: text,
  location: text,
  status: text,
  created_at: nat64,
});

// Route struct
const Route = Record({
  id: text,
  from_location: text,
  to_location: text,
  optimized_route: text,
  distance: text,
  time_estimate: nat64,
});

// Payloads
const DriverPayload = Record({
  name: text,
  license_number: text,
  contact_info: text,
});

const VehiclePayload = Record({
  registration_number: text,
  model: text,
  capacity: nat64,
  location: text,
});

const BookingPayload = Record({
  vehicle_id: text,
  driver_id: text,
  from_location: text,
  to_location: text,
  start_time: nat64,
  end_time: nat64,
});

const FuelConsumptionPayload = Record({
  vehicle_id: text,
  amount: text,
  date: nat64,
});

const MaintenancePayload = Record({
  vehicle_id: text,
  description: text,
  scheduled_date: nat64,
});

const EmergencyAssistancePayload = Record({
  vehicle_id: text,
  description: text,
  location: text,
});

const RoutePayload = Record({
  from_location: text,
  to_location: text,
});

// Message Enum
const Message = Variant({
  Success: text,
  Error: text,
  NotFound: text,
  InvalidPayload: text,
});

// Storage initialization
const driverStorage = StableBTreeMap(0, text, Driver);
const vehicleStorage = StableBTreeMap(1, text, Vehicle);
const bookingStorage = StableBTreeMap(2, text, Booking);
const fuelConsumptionStorage = StableBTreeMap(3, text, FuelConsumption);
const maintenanceStorage = StableBTreeMap(4, text, Maintenance);
const emergencyAssistanceStorage = StableBTreeMap(5, text, EmergencyAssistance);
const routeStorage = StableBTreeMap(6, text, Route);

// Canister Declaration
export default Canister({
  // Create Driver
  createDriver: update([DriverPayload], Result(Driver, Message), (payload) => {
    // Validate payload to ensure required fields are present
    if (!payload.name || !payload.license_number || !payload.contact_info) {
      return Err({ InvalidPayload: "Missing required fields" });
    }

    // Generate a unique ID for the driver
    const driverId = uuidv4();

    // Create the driver object
    const driver = {
      id: driverId,
      owner: ic.caller(),
      ...payload,
      points: BigInt(0),
      created_at: ic.time(),
    };

    // Insert the driver into the storage
    driverStorage.insert(driverId, driver);

    // Return a successful result
    return Ok(driver);
  }),

  // Get Drivers
  getDrivers: query([], Result(Vec(Driver), Message), () => {
    const drivers = driverStorage.values();
    if (drivers.length === 0) {
      return Err({ NotFound: "No drivers found" });
    }
    return Ok(drivers);
  }),

  // Get Driver by ID
  getDriverById: query([text], Result(Driver, Message), (driverId) => {
    const driverOpt = driverStorage.get(driverId);
    if ("None" in driverOpt) {
      return Err({ NotFound: "Driver not found" });
    }
    return Ok(driverOpt.Some);
  }),

  // Fetch Driver by Principal
  getDriverByPrincipal: query([], Result(Driver, Message), () => {
    const driverOpt = driverStorage.values().filter((driver) => {
      return driver.owner === ic.caller();
    });

    if (driverOpt.length === 0) {
      return Err({ NotFound: "Driver not found" });
    }

    return Ok(driverOpt[0]);
  }),

  // Create Vehicle
  createVehicle: update(
    [VehiclePayload],
    Result(Vehicle, Message),
    (payload) => {
      if (
        !payload.registration_number ||
        !payload.model ||
        !payload.capacity ||
        !payload.location
      ) {
        return Err({ InvalidPayload: "Missing required fields" });
      }
      const vehicleId = uuidv4();
      const vehicle = {
        id: vehicleId,
        ...payload,
        status: { Available: null },
        created_at: ic.time(),
      };
      vehicleStorage.insert(vehicleId, vehicle);
      return Ok(vehicle);
    }
  ),

  // Get Vehicle by ID
  getVehicleById: query([text], Result(Vehicle, Message), (vehicleId) => {
    const vehicleOpt = vehicleStorage.get(vehicleId);
    if ("None" in vehicleOpt) {
      return Err({ NotFound: "Vehicle not found" });
    }
    return Ok(vehicleOpt.Some);
  }),

  // Get Vehicle by Registration Number
  getVehicleByRegistrationNumber: query(
    [text],
    Result(Vehicle, Message),
    (registrationNumber) => {
      const vehicleOpt = vehicleStorage.values().filter((vehicle) => {
        return vehicle.registration_number === registrationNumber;
      });

      if (vehicleOpt.length === 0) {
        return Err({ NotFound: "Vehicle not found" });
      }

      return Ok(vehicleOpt[0]);
    }
  ),

  // Get Vehicle by model
  getVehicleByModel: query([text], Result(Vec(Vehicle), Message), (model) => {
    const vehicleOpt = vehicleStorage.values().filter((vehicle) => {
      return vehicle.model === model;
    });

    if (vehicleOpt.length === 0) {
      return Err({ NotFound: "Vehicle not found" });
    }

    return Ok(vehicleOpt);
  }),

  // Get Vehicles
  getVehicles: query([], Result(Vec(Vehicle), Message), () => {
    const vehicles = vehicleStorage.values();
    if (vehicles.length === 0) {
      return Err({ NotFound: "No vehicles found" });
    }
    return Ok(vehicles);
  }),

  // Create Booking
  createBooking: update(
    [BookingPayload],
    Result(Booking, Message),
    (payload) => {
      if (
        !payload.from_location ||
        !payload.to_location ||
        payload.start_time <= ic.time()
      ) {
        return Err({ InvalidPayload: "Invalid booking data" });
      }

      // Check if the vehicle is available
      const vehicleOpt = vehicleStorage.values().filter((vehicle) => {
        return vehicle.id === payload.vehicle_id;
      });

      if (vehicleOpt.length === 0) {
        return Err({ NotFound: "Vehicle not found" });
      }

      if (vehicleOpt[0].status !== "Available") {
        return Err({ Error: "Vehicle is not available" });
      }

      // Check if the driver is available
      const driverOpt = driverStorage.values().filter((driver) => {
        return driver.id === payload.driver_id;
      });

      if (driverOpt.length === 0) {
        return Err({ NotFound: "Driver not found" });
      }

      const bookingId = uuidv4();
      const booking = {
        id: bookingId,
        ...payload,
        status: "pending",
        created_at: ic.time(),
      };
      bookingStorage.insert(bookingId, booking);
      return Ok(booking);
    }
  ),

  // Get Bookings
  getBookings: query([], Result(Vec(Booking), Message), () => {
    const bookings = bookingStorage.values();
    if (bookings.length === 0) {
      return Err({ NotFound: "No bookings found" });
    }
    return Ok(bookings);
  }),

  // Get Booking by ID
  getBookingById: query([text], Result(Booking, Message), (bookingId) => {
    const bookingOpt = bookingStorage.get(bookingId);
    if ("None" in bookingOpt) {
      return Err({ NotFound: "Booking not found" });
    }
    return Ok(bookingOpt.Some);
  }),

  // Get Booking by Vehicle ID
  getBookingByVehicleId: query(
    [text],
    Result(Vec(Booking), Message),
    (vehicleId) => {
      const bookings = bookingStorage.values().filter((booking) => {
        return booking.vehicle_id === vehicleId;
      });

      if (bookings.length === 0) {
        return Err({ NotFound: "No bookings found" });
      }

      return Ok(bookings);
    }
  ),

  // Get Booking by Driver ID
  getBookingByDriverId: query(
    [text],
    Result(Vec(Booking), Message),
    (driverId) => {
      const bookings = bookingStorage.values().filter((booking) => {
        return booking.driver_id === driverId;
      });

      if (bookings.length === 0) {
        return Err({ NotFound: "No bookings found" });
      }

      return Ok(bookings);
    }
  ),

  // Record Fuel Consumption
  recordFuelConsumption: update(
    [FuelConsumptionPayload],
    Result(FuelConsumption, Message),
    (payload) => {
      if (parseFloat(payload.amount) <= 0) {
        return Err({ InvalidPayload: "Amount must be greater than zero" });
      }

      // Check if the vehicle exists
      const vehicleOpt = vehicleStorage.values().filter((vehicle) => {
        return vehicle.id === payload.vehicle_id;
      });

      if (vehicleOpt.length === 0) {
        return Err({ NotFound: "Vehicle not found" });
      }

      const consumptionId = uuidv4();
      const fuelConsumption = {
        id: consumptionId,
        ...payload,
      };
      fuelConsumptionStorage.insert(consumptionId, fuelConsumption);
      return Ok(fuelConsumption);
    }
  ),

  // Get Fuel Consumption Records
  getFuelConsumptions: query([], Result(Vec(FuelConsumption), Message), () => {
    const records = fuelConsumptionStorage.values();
    if (records.length === 0) {
      return Err({ NotFound: "No fuel consumption records found" });
    }
    return Ok(records);
  }),

  // Schedule Maintenance
  scheduleMaintenance: update(
    [MaintenancePayload],
    Result(Maintenance, Message),
    (payload) => {
      if (!payload.description || payload.scheduled_date <= ic.time()) {
        return Err({ InvalidPayload: "Invalid maintenance data" });
      }

      // Check if the vehicle exists
      const vehicleOpt = vehicleStorage.values().filter((vehicle) => {
        return vehicle.id === payload.vehicle_id;
      });

      if (vehicleOpt.length === 0) {
        return Err({ NotFound: "Vehicle not found" });
      }

      const maintenanceId = uuidv4();
      const maintenance = {
        id: maintenanceId,
        ...payload,
        status: "pending",
        created_at: ic.time(),
      };
      maintenanceStorage.insert(maintenanceId, maintenance);
      return Ok(maintenance);
    }
  ),

  // Get Maintenance Records
  getMaintenances: query([], Result(Vec(Maintenance), Message), () => {
    const records = maintenanceStorage.values();
    if (records.length === 0) {
      return Err({ NotFound: "No maintenance records found" });
    }
    return Ok(records);
  }),

  // Request Emergency Assistance
  requestEmergencyAssistance: update(
    [EmergencyAssistancePayload],
    Result(EmergencyAssistance, Message),
    (payload) => {
      if (!payload.description || !payload.location) {
        return Err({ InvalidPayload: "Invalid emergency assistance data" });
      }

      // Check if the vehicle exists
      const vehicleOpt = vehicleStorage.values().filter((vehicle) => {
        return vehicle.id === payload.vehicle_id;
      });

      if (vehicleOpt.length === 0) {
        return Err({ NotFound: "Vehicle not found" });
      }

      const assistanceId = uuidv4();
      const emergencyAssistance = {
        id: assistanceId,
        ...payload,
        status: "pending",
        created_at: ic.time(),
      };
      emergencyAssistanceStorage.insert(assistanceId, emergencyAssistance);
      return Ok(emergencyAssistance);
    }
  ),

  // Get Emergency Assistance Records
  getEmergencyAssistances: query(
    [],
    Result(Vec(EmergencyAssistance), Message),
    () => {
      const records = emergencyAssistanceStorage.values();
      if (records.length === 0) {
        return Err({ NotFound: "No emergency assistance records found" });
      }
      return Ok(records);
    }
  ),

  // Create Route
  createRoute: update([RoutePayload], Result(Route, Message), (payload) => {
    if (!payload.from_location || !payload.to_location) {
      return Err({ InvalidPayload: "Invalid route data" });
    }
    const routeId = uuidv4();
    const route = {
      id: routeId,
      from_location: payload.from_location,
      to_location: payload.to_location,
      optimized_route: `Optimized route from ${payload.from_location} to ${payload.to_location}`,
      distance: "100km",
      time_estimate: BigInt(3600),
    };

    routeStorage.insert(routeId, route);
    return Ok(route);
  }),

  // Get Routes
  getRoutes: query([], Result(Vec(Route), Message), () => {
    const routes = routeStorage.values();
    if (routes.length === 0) {
      return Err({ NotFound: "No routes found" });
    }
    return Ok(routes);
  }),

  // Get Route by ID
  getRouteById: query([text], Result(Route, Message), (routeId) => {
    const routeOpt = routeStorage.get(routeId);
    if ("None" in routeOpt) {
      return Err({ NotFound: "Route not found" });
    }
    return Ok(routeOpt.Some);
  }),
});
