const margin = { top: 60, right: 60, bottom: 50, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;


const parseDate = d3.timeParse("%Y-%m-%d");


const x = d3.scaleBand().range([0, width]).padding(0.1);
const yTemp = d3.scaleLinear().range([height, 0]);
const yPrcp = d3.scaleLinear().range([height, 0]);


const svg = d3.select(".climate_chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2 + 20)  // Adjusted y position of title
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text("Climate Chart Osijek 2022.");


d3.json("data/os_2022.json").then(data => {
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.tavg = +d.tavg;
        d.prcp = +d.prcp;
    });

    // Aggregate data by month
    const monthlyData = d3.rollup(data,
        v => ({
            tavg: d3.mean(v, d => d.tavg),
            prcp: d3.sum(v, d => d.prcp)
        }),
        d => d3.timeMonth(d.date)
    );

    // Convert the aggregated data to an array
    const aggregatedData = Array.from(monthlyData, ([key, value]) => ({
        month: key,
        tavg: value.tavg,
        prcp: value.prcp
    }));

    // Sort data by month
    aggregatedData.sort((a, b) => d3.ascending(a.month, b.month));

    // Scale the range of the data
    x.domain(aggregatedData.map(d => d.month));
    yTemp.domain([-10, 30]);
    yPrcp.domain([0, d3.max(aggregatedData, d => d.prcp) + 20]);  // to add 20 to the max height

    // Calculate zero temperature line position
    const zeroTempY = yTemp(0);


    svg.selectAll(".bar")
        .data(aggregatedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.month))
        .attr("width", x.bandwidth())
        .attr("y", d => zeroTempY - (height - yPrcp(d.prcp)))
        .attr("height", d => height - yPrcp(d.prcp))
        .attr("fill", "lightgreen");


    const tempLine = d3.line()
        .x(d => x(d.month) + x.bandwidth() / 2)
        .y(d => yTemp(d.tavg));

    svg.append("path")
        .datum(aggregatedData)
        .attr("class", "line")
        .attr("d", tempLine);


    svg.append("g")
        .attr("transform", `translate(0,${zeroTempY})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")))
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Months");

    // Add the Y Axis (left for temperature)
    svg.append("g")
        .attr("transform", `translate(0,0)`)
        .call(d3.axisLeft(yTemp).ticks(10))
    // .append("text")
    // .attr("class", "axis-label")
    // .attr("transform", "rotate(-90)")
    // .attr("y", -margin.left + 15)
    // .attr("x", -height / 2)
    // .attr("dy", "1em")
    // .style("text-anchor", "middle")
    // .text("Temperature (°C)");  //ovako ne želi prikazati u labelu text

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)");


    // Add the Y Axis (right for precipitation)
    svg.append("g")
        .attr("transform", `translate(${width},${zeroTempY - height})`)
        .call(d3.axisRight(yPrcp).ticks(10))
    // .append("text")
    // .attr("class", "axis-label")
    // .attr("transform", "rotate(-90)")
    // .attr("y", -margin.right + 15)
    // .attr("x", -height / 2)
    // .attr("dy", "1em")
    // .style("text-anchor", "middle")
    // .text("Precipitation (mm)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", width + 30)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Precipitation (mm)");
}).catch(error => console.error(error));