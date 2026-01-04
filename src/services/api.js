export const fetchDashboardData = async (apiKey) => {
    try {
        const headers = {};
        if (apiKey) {
            headers['x-snowflake-key'] = apiKey;
        }

        const response = await fetch('http://localhost:3001/api/dashboard-data', {
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rows = await response.json();

        // Map Snowflake columns (uppercase) to frontend keys
        return rows.map(row => {
            const daysRemaining = row.ESTIMATED_DAYS_LEFT ?? 999;
            const leadTime = row.LEAD_TIME_DAYS ?? 0;

            // Replicate status logic from mockData
            let status = 'OK';
            if (daysRemaining < leadTime + 2) status = 'CRITICAL';
            else if (daysRemaining < leadTime * 2) status = 'WARNING';

            return {
                locationName: row.LOCATION_NAME,
                itemName: row.ITEM_NAME,
                category: row.CATEGORY,
                closingStock: row.CLOSING_STOCK,
                leadTimeDays: leadTime,
                daysRemaining: Math.round(daysRemaining), // ensure integer
                status: status
            };
        });
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        throw error;
    }
};
