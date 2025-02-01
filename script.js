
let sidebarOpen = false;
let sidebar = document.getElementById("sidebar");

function openSidebar() {
    if(!sidebarOpen) {
        sidebar.classList.add("sidebar-responsive");
        sidebarOpen = true;
    }
}

function closeSidebar() {
    if(sidebarOpen) {
        sidebar.classList.remove("sidebar-responsive");
        sidebarOpen = false;
    }
}

// Search Bar

document.querySelector('.search-icon').addEventListener('click', () => {
  const searchBar = document.getElementById('search-bar');
  searchBar.classList.toggle('visible');
  searchBar.focus();
});

function performSearch(event) {
  event.preventDefault(); // Prevent form submission
  const query = document.getElementById('search-bar').value.trim();

  clearHighlights();

  if (query) {
      console.log(`Searching for: ${query}`); 
      highlightText(query);
  } else {
      alert('Please enter a search term.');
  }
}

// Search highlight

function highlightText(query) {
  const body = document.body;
  const regex = new RegExp(`(${query})`, 'gi'); // Case-insensitive for the query

  processTextNodes(body, regex);
}

function processTextNodes(element, regex) {
  for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
          // Replace matches in text nodes
          const parent = node.parentNode;
          const text = node.textContent;

          // Only process if there's a match
          if (regex.test(text)) {
              const highlightedHTML = text.replace(regex, '<span class="highlight">$1</span>');
              const tempContainer = document.createElement('div');
              tempContainer.innerHTML = highlightedHTML;

              // Replace text node with its highlighted HTML
              while (tempContainer.firstChild) {
                  parent.insertBefore(tempContainer.firstChild, node);
              }
              parent.removeChild(node); // Remove the original text node
          }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
          
          processTextNodes(node, regex);
      }
  }
}

function clearHighlights() {
  const highlightedElements = document.querySelectorAll('.highlight');
  highlightedElements.forEach((element) => {
      const parent = element.parentNode;
      parent.replaceChild(document.createTextNode(element.textContent), element);
  });
}

function toggleSearch() {
  const searchBar = document.getElementById('search-bar');
  if (searchBar.style.display === 'none' || searchBar.style.display === '') {
      searchBar.style.display = 'block';
      searchBar.focus();
  } else {
      searchBar.style.display = 'none';
      clearHighlights();
  }
}

// ---------- CARDS ----------

const sheetUrlCards = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8IBErmhytbfzAV2ZG8dMU0BosoNoP4oLD-JJWZHZdE951NQP5c7Poe3yhPaxVjuWiRAradKlouwnW/pub?output=csv&gid=808124326';

function updateCardValues() {
  fetch(sheetUrlCards)
    .then(response => response.text())
    .then(data => {
      const parsedData = Papa.parse(data, { header: true });
      const rows = parsedData.data;

      const settlements = rows[0]["Settlements"];
      const casesSettled = rows[0]["Cases Settled"];
      const newCasesSigned = rows[0]["New Cases Signed"];

      // Update cards dynamically
      
      document.getElementById("settlements").textContent = `$${settlements}`;
      document.getElementById('cases-settled').textContent = casesSettled;
      document.getElementById('new-cases-signed').textContent = newCasesSigned;
    })
    .catch(error => console.error("Error fetching card data:", error));
}

updateCardValues();



// ---------- CHARTS ----------

// BAR CHART 1 - GMB Data

const sheetUrlGidGmb = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8IBErmhytbfzAV2ZG8dMU0BosoNoP4oLD-JJWZHZdE951NQP5c7Poe3yhPaxVjuWiRAradKlouwnW/pub?output=csv&gid=0';

let dynamicGmbChart; // Updated variable name

const colorMap = {
  "Burbank": "#2962ff",   // Blue
  "Westlake": "#d50000",  // Red
  "Sun Valley": "#2e7d32",  // Green
  "Unknown": "#ffa500", // Orange
};

// Get a fixed color based on location
function getFixedColor(location) {
  return colorMap[location] || "#ffffff"; // Default to white if location not found
}

function updateGmbChart() {
    fetch(sheetUrlGidGmb)
        .then(response => response.text())
        .then(data => {
            const parsedData = Papa.parse(data, { header: true });

            if (!parsedData.data || parsedData.data.length === 0) {
                console.error("No data found in CSV!");
                return;
            }

            console.log("Parsed Data:", parsedData);

            const headers = parsedData.meta.fields || []; // Extract column names safely
            const rows = parsedData.data; 

            // Extract labels (Columns B to E, excluding "Location")
            const labels = headers.slice(1, 5); // ["Profile Interaction", "Web Clicks", "Calls", "Directions"]
            console.log("Labels:", labels);

            // Group data by Location and extract values 
            const groupedData = rows.map(row => ({
                location: row["Location"] || "Unknown", // Fallback if Location is missing
                values: labels.map(label => {
                    let val = parseFloat((row[label] || "0").replace(/,/g, '')) || 0; // Remove commas & parse safely
                    return isNaN(val) ? 0 : val;
                }),
            }));

            console.log("Grouped Data:", groupedData);

            // Flatten data for Chart.js
            const datasets = groupedData.map(group => ({
                label: group.location,
                data: group.values,
                backgroundColor: getFixedColor(group.location), // Fixed colors per location
                borderRadius: 10
            }));

            console.log("Chart.js Dataset:", datasets);

            // Destroy previous chart if it exists
            if (dynamicGmbChart) {
                dynamicGmbChart.destroy();
            }

            // Render new Chart.js Bar Chart
            let ctx = document.getElementById("gmb-chart").getContext("2d");

            dynamicGmbChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow resizing
                    scales: {
                        x: {
                            ticks: { color: "#ffffff" }, // White text on x-axis
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { color: "#ffffff" }, // White text on y-axis
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: "#ffffff" // White text for legend
                            }
                        }
                    }
                }
            });

        })
        .catch(error => console.error("Error fetching data:", error));
}

updateGmbChart();


// BAR CHART - Marketing Data

const sheetUrlMarketing = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8IBErmhytbfzAV2ZG8dMU0BosoNoP4oLD-JJWZHZdE951NQP5c7Poe3yhPaxVjuWiRAradKlouwnW/pub?output=csv';

let MarketingChart;

function updateMarketingChart() {
  const MarketingChartContainer = document.getElementById('csv-chart');
  if (!MarketingChartContainer || !MarketingChartContainer.getContext) {
    console.error('Element with id "csv-chart" not found or is not a <canvas>.');
    return;
  }

  const ctx = MarketingChartContainer.getContext('2d');

  fetch(sheetUrlMarketing) 
    .then(response => response.text())
    .then(data => {
      const parsedData = Papa.parse(data, { header: true });
      const rows = parsedData.data;
      const headers = parsedData.meta.fields;

      // Ensure valid labels
      const labels = headers.slice(2, 7).filter(label => label.trim() !== "");
      if (!labels.length) {
        console.error("No valid labels found in CSV.");
        return;
      }

      // Color scheme for better distinction
      const colors = ['#C10000', '#2862FF', '#f4bc31', 'rgba(75, 192, 192, 0.6)'];
      const borderColors = colors.map(color => color.replace('0.6', '1'));

      const datasets = rows.map((row, rowIndex) => ({
        label: row[headers[0]], 
        data: headers.slice(2, 7).map(header => parseFloat(row[header]) || 0),
        backgroundColor: colors[rowIndex % colors.length],
        borderColor: borderColors[rowIndex % colors.length],
        borderWidth: 2,
        borderRadius: 10,
      })).filter(dataset => dataset.label && dataset.data.some(value => value > 0));

      console.log("Labels for Marketing Chart:", labels);

      // Dynamic max value for better scaling
      const maxValue = Math.max(...datasets.flatMap(d => d.data)) || 10000;
      const yMax = maxValue > 10000 ? maxValue : 10000;

      // Render or update the Chart.js chart
      if (MarketingChart) { 
        MarketingChart.destroy();
      }
      MarketingChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: '#ffffff' },
              title: { display: true, text: 'Analytics', color: '#ffffff' },
            },
            y: {
              beginAtZero: true,
              max: yMax,
              title: { display: true, text: `Metric (Max: ${yMax})`, color: '#ffffff' },
              ticks: { color: '#ffffff' },
            },
          },
          plugins: {
            legend: { labels: { color: '#ffffff' } },
          },
        },
      });
    })
    .catch(error => console.error("Error fetching Marketing Chart data:", error));
}

document.addEventListener("DOMContentLoaded", updateMarketingChart);



// PROGRESS BAR - Goals

const progressSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8IBErmhytbfzAV2ZG8dMU0BosoNoP4oLD-JJWZHZdE951NQP5c7Poe3yhPaxVjuWiRAradKlouwnW/pub?output=csv&gid=1204409279';

let progressBar;

const maxValues = {
  "Cases Signed": 5,
  "Complaints Filed": 5,
  "Reviews": 5,
  "Calls": 250
};

function progressGoogleSheetsData() {
  Papa.parse(progressSheetURL, {
    download: true,
    header: true,
    complete: function(results) {
      const progressData = results.data;
      updateProgressBar(progressData);
    }
  });
}

function updateProgressBar(progressData) {
  let progressValues = {
      "Cases Signed": progressData[0]["Cases Signed"] || 0,
      "Complaints Filed": progressData[0]["Complaints Filed"] || 0,
      "Reviews": progressData[0]["Reviews"] || 0,
      "Calls": progressData[0]["Calls"] || 0
  };

  // Convert values into percentages
  let percentageValues = Object.keys(progressValues).map(label => {
    return (progressValues[label] / maxValues[label]) * 100; // Convert to percentage
  });

  Object.keys(progressValues).forEach(key => {
    console.log(`${key}: ${progressValues[key]} (Goal: ${maxValues[key]}, Percentage: ${(progressValues[key] / maxValues[key]) * 100}%)`);
  });

  let labels = Object.keys(progressValues);

  if (progressBar) {
    progressBar.data.datasets[0].data = percentageValues;
    progressBar.update();
  }
}

// Initialize Chart.js Progress Bar
document.addEventListener("DOMContentLoaded", function() {
  let ctx = document.getElementById("progress-chart").getContext("2d");

  progressBar = new Chart(ctx, {
      type: "bar",
      data: {
          labels: ["Cases Signed", "Complaints Filed", "Reviews", "Calls"],
          datasets: [{
              label: "Progress (%)",
              data: [0, 0, 0, 0], // Start empty
              backgroundColor: ["#2e7d32", "#ff6d00", "#2962ff", "#d50000"],
              borderRadius: 10
          }]
      },
      options: {
          indexAxis: "y", // Horizontal bars
          responsive: true,
          maintainAspectRatio: true,
          scales: {
              x: {
                  min: 0,
                  max: 100, // Adjusted dynamically later
                  ticks: { 
                    color: '#ffffff',
                    callback: function(value) {
                      return value + "%";
                    } 
                  }
              },
          y: {
              ticks: { color: '#ffffff',
                maxRotation: 90,
                minRotation: 20,
              }
          }
        },
        plugins: {
          legend: { display: false }
      }
    }
  });

  // Fetch Google Sheets Data
  progressGoogleSheetsData();
  setInterval(progressGoogleSheetsData, 5000); // Auto-refresh every 5 seconds
});
