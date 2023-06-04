class MenuQualification {
    
	constructor(params) {
        var self = this;
		this.titles = null;
        var me = this;
        this.cont = d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.callback = params.callback ? params.callback : null;
        if (!params.data)
            throw new Exception("no data for sunburst");
        this.data = params.data;
		this.selectedItems = [];
		
        var svgMenu, objEW, color
        ,format = d3.format(",d")
        ,radius = this.width / 6
        ,arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
                .padRadius(radius * 1.5)
                .innerRadius(d => d.y0 * radius)
                .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))
        , partition = data => {
            self.root = d3.hierarchy(data)
                    .sum(d => d.size)
                    .sort((a, b) => b.value - a.value);
            return d3.partition()
                    .size([2 * Math.PI, self.root.height + 1])
                    (self.root);
        };
		this.radius = radius;
		this.arc = arc;

		// init
		console.log(me.data);
		self.root = partition(me.data);
		color = d3.scaleOrdinal().range(d3.quantize(d3.interpolateRainbow, me.data.children.length + 1));

		self.root.each(d => d.current = d);

		//ajoute le svg du menu
		svgMenu = me.cont.append("svg")
				.style("width", "96%")
				.style("height", "96%")
				.style("position","absolute")
				.attr('viewBox',"0 0 "+me.width+" "+me.width)
				.style("font", "5px sans-serif");
				//.style("overflow-wrap", "break-word"); // does not work

		self.g = svgMenu.append("g")
				.attr("transform", `translate(${me.width / 2},${me.width / 2})`);

		self.path = self.g.append("g")
				.selectAll("path")
				.data(self.root.descendants().slice(1))
				.join("path")
				.attr("fill", d => {
					while (d.depth > 1)
						{ d = d.parent; }
					return color(d.data.name);
				})
				.attr("fill-opacity", d => self.arcVisible(d.current) ? (d.children ? 1 : 0.8) : 0)
				.attr("d", d => self.arc(d.current));

		/*le click uniqument sur cases avec des enfants
		self.path.filter(d => d.children)
				.style("cursor", "pointer")
				.on("click", clickOnArea);
		*/
		self.path.style("cursor", "pointer")
			.on("click", function(d) {
				self.clickOnArea(this, d);
			});

		self.path.append("title")
			.text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);            
		
		self.parent = self.g.append("circle")
			.datum(self.root)
			.attr("r", radius)
			.attr("fill", "none")
			.attr("pointer-events", "all")
			.on("click", function(d) {
				self.clickOnArea(this, d);
			});
		
		self.g.append("circle")
			.attr("r", "10")
			.attr("stroke", "black")
			.attr("stroke-width", "0.5")
			.attr("fill", "white")
			.attr("class", "validation")
			.style("cursor", "pointer")
			.on("click", function(d) {
				self.clickOnValidate(this, d);
			});
			
		self.g.append("text")
			.attr("dx", "-8")
			.attr("dy", "2")
			.style("cursor", "pointer")
			.text("Valider")
			.on("click", function(d) {
				self.clickOnValidate(this, d);
			});
		
		var descendants = self.root.descendants().slice(1);
		
		var dataLabel = self.g.append("g")
				//.attr("pointer-events", "none")
				.attr("text-anchor", "middle")
				.style("user-select", "none");
		
		self.label = dataLabel
				.selectAll("text")
				.data(descendants)
				.join("text")
				.attr("dy", "0.35em")
				.attr("fill-opacity", d => +self.labelVisible(d.current))
				.attr("transform", d => self.labelTransform(d.current))
				.text(d => d.data.name);
		this.wrap(self.label, 30);
		
		self.checkboxes = dataLabel
				.selectAll("circle")
				.data(descendants)
				.join("circle")
				.attr("cx", "0")
				.attr("cy", "0")
				.attr("r", "2")
				.attr("stroke", "black")
				.attr("stroke-width", "0.5")
				.attr("fill", "white")
				.attr("class", "checkbox")
				.style("cursor", "pointer")
				.attr("display", d => self.checkboxVisible(d.current))
				.attr("transform", d => self.checkboxTransform(d.current))
				.on("click", function(d) {
					self.clickedOnCheckbox(this, d);
				});		
    }
	wrap(text, width) {
		text.each(function() {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 1,
				lineHeight = 1.1, // ems
				y = text.attr("y"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
			var firstSpan = tspan;
			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					if (line.length == 1) {
						tspan.text(line.join(" "));
						line = []
						if (words.length > 0) {
							tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", "1em");
							lineNumber++;
						}
					} else {
						line.pop();
						tspan.text(line.join(" "));
						line = [word];
						tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", "1em").text(word);
						lineNumber++;
					}
				}					
			}
			firstSpan.attr("dy", (-0.5*(lineNumber-1)+0.25) + "em");
		});
	}
	arcVisible(d) {
		return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
	}
	labelVisible(d) {
		return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
	}
	labelTransform(d) {
		const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
		const y = (d.y0 + d.y1) / 2 * this.radius;
		return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
	}
	checkboxVisible(d) {
		if (d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03)
			return "inline";
		else
			return "none";
	}
	checkboxTransform(d) {
		const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
		const y = (d.y0 + d.y1) / 2 * this.radius;
		return `rotate(${x - 90}) translate(${y-17},0) rotate(${x < 180 ? 0 : 180})`;
	}
	clickedOnCheckbox(domElt, data) {		
		var checkbox = d3.select(domElt);
		if (checkbox.attr("fill") == "white") {
			this.selectedItems.push(data);
			checkbox.attr("fill", "grey");
		} else {
			var index = this.selectedItems.indexOf(data);
			if (index >= 0)
				this.selectedItems.splice(index, 1);
			checkbox.attr("fill", "white");
		}
	}
	clickOnValidate(domElt, data) {
		this.callback(this.selectedItems);
	}
	clickOnArea(domElt, data) {
		var self = this;
		
		//si pas d'enfant on sort
		if (!data.children)
			return;

		self.parent.datum(data.parent || self.root);

		self.root.each(d => d.target = {
				x0: Math.max(0, Math.min(1, (d.x0 - data.x0) / (data.x1 - data.x0))) * 2 * Math.PI,
				x1: Math.max(0, Math.min(1, (d.x1 - data.x0) / (data.x1 - data.x0))) * 2 * Math.PI,
				y0: Math.max(0, d.y0 - data.depth),
				y1: Math.max(0, d.y1 - data.depth)
			});

		const t = self.g.transition().duration(750);

		// Transition the data on all arcs, even the ones that aren’t visible,
		// so that if this transition is interrupted, entering arcs will start
		// the next transition from the desired position.
		self.path.transition(t)
				.tween("data", d => {
					const i = d3.interpolate(d.current, d.target);
					return t => d.current = i(t);
				})
				.filter(function (d) {
					return +this.getAttribute("fill-opacity") || self.arcVisible(d.target);
				})
				.attr("fill-opacity", d => self.arcVisible(d.target) ? (d.children ? 1 : 0.8) : 0)
				.attrTween("d", d => () => self.arc(d.current));

		self.label.filter(function (d) {
				return +this.getAttribute("fill-opacity") || self.labelVisible(d.target);
			}).transition(t)
					.attr("fill-opacity", d => +self.labelVisible(d.target))
					.attrTween("transform", d => () => self.labelTransform(d.current));
					
		self.checkboxes.filter(function (d) {
				return +this.getAttribute("fill-opacity") || self.checkboxVisible(d.target);
			}).transition(t)
					.attr("display", d => self.checkboxVisible(d.target))
					.attrTween("transform", d => () => self.checkboxTransform(d.current));
	}
}