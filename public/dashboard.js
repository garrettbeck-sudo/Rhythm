(() => {
  const canvas = document.querySelector("#dashboard-chart");
  if (!canvas || typeof Chart === "undefined") return;

  let chartData;
  try {
    chartData = JSON.parse(canvas.dataset.chart || "{}");
  } catch {
    return;
  }

  function normalizedHex(value) {
    const match = String(value || "").match(/^#([a-f\d]{3}|[a-f\d]{6})$/i);
    if (!match) return "#879889";
    const digits = match[1].length === 3
      ? match[1].split("").map((digit) => `${digit}${digit}`).join("")
      : match[1];
    return `#${digits}`;
  }

  function withAlpha(value, alpha) {
    const hex = normalizedHex(value).slice(1);
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.metric === "planned" ? withAlpha(dataset.color, 0.36) : normalizedHex(dataset.color),
        borderColor: normalizedHex(dataset.color),
        borderWidth: 1,
        borderRadius: 3,
        categoryName: dataset.categoryName,
        metric: dataset.metric,
        stack: dataset.stack,
        maxBarThickness: 32,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#758379",
            boxWidth: 10,
            boxHeight: 10,
            padding: 12,
            font: { family: "Inter, sans-serif", size: 10 },
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.categoryName} · ${context.dataset.metric}: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: "#758379", font: { size: 10 } },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: "#89958a", precision: 0, stepSize: 1 },
          grid: { color: "rgba(117, 131, 121, 0.12)" },
          border: { display: false },
        },
      },
    },
  });
})();
