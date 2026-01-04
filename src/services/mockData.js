import { startOfMonth, subDays, format } from 'date-fns';

const LOCATIONS = [
  { id: 'LOC-001', name: 'Central Hospital', region: 'North' },
  { id: 'LOC-002', name: 'Rural Clinic A', region: 'North' },
  { id: 'LOC-003', name: 'Warehouse Main', region: 'Central' },
  { id: 'LOC-004', name: 'Emergency Post B', region: 'South' },
];

const ITEMS = [
  { id: 'ITM-001', name: 'Paracetamol 500mg', category: 'Medicine', leadTime: 3 },
  { id: 'ITM-002', name: 'Amoxicillin 250mg', category: 'Medicine', leadTime: 5 },
  { id: 'ITM-003', name: 'Surgical Masks', category: 'Supplies', leadTime: 7 },
  { id: 'ITM-004', name: 'IV Set', category: 'Supplies', leadTime: 10 },
  { id: 'ITM-005', name: 'Rice (50kg Bag)', category: 'Food', leadTime: 14 },
];

export const generateMockData = () => {
  const data = [];

  // Generate data for current stock snapshot
  LOCATIONS.forEach(loc => {
    ITEMS.forEach(item => {
      // Random stock levels
      const closing = Math.floor(Math.random() * 500);
      const dailyUsage = Math.floor(Math.random() * 20) + 1; // avg usage
      const daysLeft = Math.floor(closing / dailyUsage);

      data.push({
        locationId: loc.id,
        locationName: loc.name,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        closingStock: closing,
        leadTimeDays: item.leadTime,
        avgDailyUsage: dailyUsage,
        daysRemaining: daysLeft,
        status: daysLeft < item.leadTime + 2 ? 'CRITICAL' : (daysLeft < item.leadTime * 2 ? 'WARNING' : 'OK')
      });
    });
  });
  //console.log(data);
  return data;
};

export const getLocations = () => LOCATIONS;
export const getItems = () => ITEMS;
