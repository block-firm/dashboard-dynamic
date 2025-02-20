// ---------- Fetch Data from Google Sheets ----------
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbuiacsaHXFHf6WsVqdE5nvCpPyZc_CkwaWdG5G5R4MmKc4P6hUt3AYVwyzL1W7KGHIhubkcVRcRff/pub?output=csv';

let rawData = [];
let chartInstance;
const filters = {
    week: false,
    month: false,
    habitability: false,
    personalInjury: false
};

// Helper function to properly parse settlement amounts with commas
function parseSettlementAmount(amountStr) {
    if (!amountStr) return 0;
    
    const cleanedStr = amountStr.toString().replace(/[^0-9.]/g, '');
    const amount = Number(cleanedStr);
    console.log(`Parsed ${amountStr} to ${amount}`);
    
    return isNaN(amount) ? 0 : amount;
}

// Fetch & Initialize Data
function fetchData() {
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log("Raw data from CSV:", results.data);
            
            rawData = results.data
                .filter(row => row["Settlement Amount"] && row["Date Settled"])
                .map(row => {
                    const originalAmount = row["Settlement Amount"];
                    const parsedAmount = parseSettlementAmount(originalAmount);
                    
                    return {
                        ...row,
                        "Settlement Amount": parsedAmount,
                        "_originalAmount": originalAmount
                    };
                });
            
            console.log("Processed data with parsed numbers:", rawData);
            
            // Display total sum of all settlements initially
            updateKPIs(rawData);
            updateChart(rawData); 
            updateSuperStar(rawData);
        },
        error: function(error) {
            console.error("Error parsing CSV:", error);
        }
    });
}

// ---------- Filtering Data ----------
function filterData(filterType) {
    // Toggle the filter state
    filters[filterType] = !filters[filterType];

    // Update button appearance based on the filter state
    const buttonElement = document.getElementById(filterType + '-filter-button');
    if (filters[filterType]) {
        buttonElement.classList.add('active-filter');
    } else {
        buttonElement.classList.remove('active-filter');
    }

    // If no filters are active, reset to the original raw data
    const isAnyFilterActive = Object.values(filters).some(isActive => isActive);
    let filteredData = isAnyFilterActive ? [...rawData] : rawData;

    // Apply filters if any are still active
    if (filters.week) {
        let now = new Date();
        let weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filteredData = filteredData.filter(row => {
            const date = new Date(row["Date Settled"]);
            return !isNaN(date.getTime()) && date >= weekAgo;
        });
    }
    if (filters.month) {
        let now = new Date();
        let monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        filteredData = filteredData.filter(row => {
            const date = new Date(row["Date Settled"]);
            return !isNaN(date.getTime()) && date >= monthAgo;
        });
    }
    if (filters.habitability) {
        filteredData = filteredData.filter(row => row["Case Type"] === "Habitability");
    }
    if (filters.personalInjury) {
        filteredData = filteredData.filter(row => row["Case Type"].trim() === "Personal Injury");
    }

    console.log(`Data after filters applied:`, filteredData);
    
    updateKPIs(filteredData);
    updateChart(filteredData);
    updateSuperStar(filteredData);
}

// ---------- Update KPI Metrics ----------
function updateKPIs(data) {
    let totalSettlements = 0;

    data.forEach((row, index) => {
        const amount = row["Settlement Amount"];
        console.log(`Row ${index + 1}: ${row["Date Settled"]} - ${row["_originalAmount"]} parsed to ${amount}`);
        totalSettlements += amount;
        console.log(`Running total: ${totalSettlements}`);
    });
    
    console.log("Final total settlements:", totalSettlements);
    
    document.getElementById("total-settlements").textContent = `$${totalSettlements.toLocaleString()}`;
    document.getElementById("firm-profit").textContent = `$${(totalSettlements * 0.4).toLocaleString()}`;
}

// ---------- Update Line Chart ----------
function updateChart(data) {
    if (typeof Chart === 'undefined') {
        console.error("Chart.js is not loaded. Please add the Chart.js script to your HTML.");
        return;
    }
    
    let months = {};
    data.forEach(row => {
        if (row["Date Settled"]) {
            let date = new Date(row["Date Settled"]);
            if (!isNaN(date.getTime())) {
                let month = date.toLocaleString('default', { month: 'short' });
                months[month] = (months[month] || 0) + row["Settlement Amount"];
            }
        }
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let sortedMonths = Object.keys(months).sort((a, b) => 
        monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );
    
    let labels = sortedMonths;
    let values = sortedMonths.map(month => months[month]);

    if (chartInstance) chartInstance.destroy();
    let ctx = document.getElementById("settlements-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
        type: "line",
        data: { 
            labels, 
            datasets: [{ 
                label: "Settlements", 
                data: values, 
                backgroundColor: "rgba(0, 123, 255, 0.5)",
                borderColor: "rgba(0, 123, 255, 1)",
                tension: 0.1
            }] 
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// ---------- Update Super Star Settlement ----------
function updateSuperStar(data) {
    if (data.length === 0) {
        document.getElementById("highest-settlement").textContent = "$0";
        document.getElementById("top-attorney").textContent = "N/A";
        return;
    }
    
    let highest = data.reduce((max, row) => {
        const amount = row["Settlement Amount"];
        if (amount > max.amount) {
            return { amount: amount, attorney: row["Attorney"] || "Unknown" };
        }
        return max;
    }, { amount: 0, attorney: "N/A" });

    document.getElementById("highest-settlement").textContent = `$${highest.amount.toLocaleString()}`;
    document.getElementById("top-attorney").textContent = highest.attorney;
}

// Load Data on Page Load
document.addEventListener("DOMContentLoaded", fetchData);
