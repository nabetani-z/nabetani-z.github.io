index.html: index.haml main.js
	haml -Eutf-8 index.haml > index.html

clean:
	rm -f index.html
