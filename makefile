affiliation-chart.html: affiliation-chart.haml main.js
	haml -Eutf-8 affiliation-chart.haml > affiliation-chart.html

clean:
	rm -f affiliation-chart.html
