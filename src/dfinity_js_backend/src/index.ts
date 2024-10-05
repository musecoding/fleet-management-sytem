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

// Helper Functions
const validateId = (id: string) => id && id.trim().length > 0;

// Canister Declaration
export default Canister({
  // Create Driver
  createDriver: update([DriverPayload], Result(Driver, Message), (payload) => {
    if (!payload.name || !payload.license_number || !payload.contact_info) {
      return Err({ InvalidPayload: "Missing required fields" });
    }

    const driverId = uuidv4();
    const driver = {
      id: driverId,
      owner: ic.caller(),
      ...payload,
      points: BigInt(0),
      created_at: ic.time(),
    };

    driverStorage.insert(driverId, driver);
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
    if (!validateId(driverId)) return Err({ InvalidPayload: "Invalid driver ID" });
    const driverOpt = driverStorage.get(driverId);
    if ("None" in driverOpt) {
      return Err({ NotFound: "Driver not found" });
    }
    return Ok(driverOpt.Some);
  }),

  // Fetch Driver by Principal
  getDriverByPrincipal: query([], Result(Driver, Message), () => {
    const driverOpt = driverStorage.values().filter((driver) => driver.owner === ic.caller());
    if (driverOpt.length === 0) {
      return Err({ NotFound: "Driver not found" });
    }
    return Ok(driverOpt[0]);
  }),

  // Delete Driver
  deleteDriver: update([text], Result(Message, Message), (driverId) => {
    if (!validateId(driverId)) return Err({ InvalidPayload: "Invalid driver ID" });

    const driverOpt = driverStorage.get(driverId);
    if ("None" in driverOpt) {
      return Err({ NotFound: "Driver not found" });
    }

    driverStorage.remove(driverId);
    return Ok({ Success: "Driver deleted successfully" });
  }),

  // Get Driver by License Number
  getDriverByLicenseNumber: query([text], Result(Driver, Message), (licenseNumber) => {
    const driverOpt = driverStorage.values().filter((driver) => driver.license_number === licenseNumber);
    if (driverOpt.length === 0) {
      return Err({ NotFound: "Driver not found with this license number" });
    }
    return Ok(driverOpt[0]);
  }),

  // Create Vehicle
  createVehicle: update([VehiclePayload], Result(Vehicle, Message), (payload) => {
    if (!payload.registration_number || !payload.model || payload.capacity <= 0 || !payload.location) {
      return Err({ InvalidPayload: "Missing or invalid vehicle data" });
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
  }),

  // Get Vehicle by ID
  getVehicleById: query([text], Result(Vehicle, Message), (vehicleId) => {
    if (!validateId(vehicleId)) return Err({ InvalidPayload: "Invalid vehicle ID" });
    const vehicleOpt = vehicleStorage.get(vehicleId);
    if ("None" in vehicleOpt) {
      return Err({ NotFound: "Vehicle not found" });
    }
    return Ok(vehicleOpt.Some);
  }),

  // Get Vehicle by Registration Number
  getVehicleByRegistrationNumber: query([text], Result(Vehicle, Message), (registrationNumber) => {
    const vehicleOpt = vehicleStorage.values().filter((vehicle) => vehicle.registration_number === registrationNumber);
    if (vehicleOpt.length === 0) {
      return Err({ NotFound: "Vehicle not found" });
    }
    return Ok(vehicleOpt[0]);
  }),

  // Delete Vehicle
  deleteVehicle: update([text], Result(Message, Message), (vehicleId) => {
    if (!validateId(vehicleId)) return Err({ InvalidPayload: "Invalid vehicle ID" });

    const vehicleOpt = vehicleStorage.get(vehicleId);
    if ("None" in vehicleOpt) {
      return Err({ NotFound: "Vehicle not found" });
    }

    vehicleStorage.remove(vehicleId);
    return Ok({ Success: "Vehicle deleted successfully" });
  }),

  // Update Vehicle Status
  updateVehicleStatus: update([text, VehicleStatus], Result(Message, Message), (vehicleId, status) => {
    if (!validateId(vehicleId)) return Err({ InvalidPayload: "Invalid vehicle ID" });

    const vehicleOpt = vehicleStorage.get(vehicleId);
    if ("None" in vehicleOpt) {
      return Err({ NotFound: "Vehicle not found" });
    }

    let vehicle = vehicleOpt.Some;
    vehicle.status = status;
    vehicleStorage.insert(vehicleId, vehicle);
    return Ok({ Success: "Vehicle status updated successfully" });
  }),

  // Create Booking
  createBooking: update([BookingPayload], Result(Booking, Message), (payload) => {
    if (!payload.from_location || !payload.to_location || payload.start_time <= ic.time()) {
      return Err({ InvalidPayload: "Invalid booking data" });
    }

    const vehicleOpt = vehicleStorage.values().filter((vehicle) => vehicle.id === payload.vehicle_id);
    if (vehicleOpt.length === 0) return Err({ NotFound: "Vehicle not found" });
    if (vehicleOpt[0].status.Available === undefined) return Err({ Error: "Vehicle is not available" });

    const driverOpt = driverStorage.values().filter((driver) => driver.id === payload.driver_id);
    if (driverOpt.length === 0) return Err({ NotFound: "Driver not found" });

    const bookingId = uuidv4();
    const booking = {
      id: bookingId,
      ...payload,
      status: "pending",
      created_at: ic.time(),
    };
    bookingStorage.insert(bookingId, booking);
    return Ok(booking);
  }),

  // Get Bookings
  getBookings: query([], Result(Vec(Booking), Message), () => {
    const bookings = bookingStorage.values();
    if (bookings.length === 0) return Err({ NotFound: "No bookings found" });
    return Ok(bookings);
  }),

  // Get Booking by Vehicle ID
  getBookingByVehicleId: query([text], Result(Vec(Booking), Message), (vehicleId) => {
    const bookings = bookingStorage.values().filter((booking) => booking.vehicle_id === vehicleId);
    if (bookings.length === 0) return Err({ NotFound: "No bookings found for this vehicle" });
    return Ok(bookings);
  }),

  // Record Fuel Consumption
  recordFuelConsumption: update([FuelConsumptionPayload], Result(FuelConsumption, Message), (payload) => {
    if (parseFloat(payload.amount) <= 0) {
      return Err({ InvalidPayload: "Amount must be greater than zero" });
    }

    const vehicleOpt = vehicleStorage.get(payload.vehicle_id);
    if ("None" in vehicleOpt) return Err({ NotFound: "Vehicle not found" });

    const consumptionId = uuidv4();
    const fuelConsumption = {
      id: consumptionId,
      ...payload,
    };
    fuelConsumptionStorage.insert(consumptionId, fuelConsumption);
    return Ok(fuelConsumption);
  }),

  // Schedule Maintenance
  scheduleMaintenance: update([MaintenancePayload], Result(Maintenance, Message), (payload) => {
    if (!payload.description || payload.scheduled_date <= ic.time()) {
      return Err({ InvalidPayload: "Invalid maintenance data" });
    }

    const vehicleOpt = vehicleStorage.get(payload.vehicle_id);
    if ("None" in vehicleOpt) return Err({ NotFound: "Vehicle not found" });

    const maintenanceId = uuidv4();
    const maintenance = {
      id: maintenanceId,
      ...payload,
      status: "pending",
      created_at: ic.time(),
    };
    maintenanceStorage.insert(maintenanceId, maintenance);
    return Ok(maintenance);
  }),

  // Request Emergency Assistance
  requestEmergencyAssistance: update([EmergencyAssistancePayload], Result(EmergencyAssistance, Message), (payload) => {
    if (!payload.description || !payload.location) {
      return Err({ InvalidPayload: "Invalid emergency assistance data" });
    }

    const vehicleOpt = vehicleStorage.get(payload.vehicle_id);
    if ("None" in vehicleOpt) return Err({ NotFound: "Vehicle not found" });

    const assistanceId = uuidv4();
    const emergencyAssistance = {
      id: assistanceId,
      ...payload,
      status: "pending",
      created_at: ic.time(),
    };
    emergencyAssistanceStorage.insert(assistanceId, emergencyAssistance);
    return Ok(emergencyAssistance);
  }),

  // Get Emergency Assistance Records
  getEmergencyAssistances: query([], Result(Vec(EmergencyAssistance), Message), () => {
    const records = emergencyAssistanceStorage.values();
    if (records.length === 0) return Err({ NotFound: "No emergency assistance records found" });
    return Ok(records);
  }),

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
    if (routes.length === 0) return Err({ NotFound: "No routes found" });
    return Ok(routes);
  }),
});
