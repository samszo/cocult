class menuSunburst {
    
	constructor(params) {
        var me = this;
		this.titles = null;
        this.cont = d3.select("#"+params.idCont);
        this.width = params.width ? params.width : 400;
        this.cbValidate = params.cbValidate ? params.cbValidate : null;
		this.cbEndInit = params.cbEndInit ? params.cbEndInit : null;
        this.data = params.data ? params.data : {
            name: 'menu',
            color: 'magenta',
            children: [{
              name: 'supprimer',
              color: 'yellow',
              size: 1
            },{
              name: 'b',
              color: 'red',
              children: [{
                name: 'ba',
                color: 'orange',
                size: 1
              }, {
                name: 'bb',
                color: 'blue',
                children: [{
                  name: 'bba',
                  color: 'green',
                  size: 1
                }, {
                  name: 'bbb',
                  color: 'pink',
                  size: 1
                }]
              }]
            }]
          }; 
		/*
        if (!params.data || !params.data.length)
            throw new Error("no data for sunburst");
		*/		
        var selectedItems = [], svgMenu, objEW, color
        ,format = d3.format(",d")
        ,radius = me.width / 6, radiusBtn = 6
        ,arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
                .padRadius(radius * 1.5)
                .innerRadius(d => d.y0 * radius)
                .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))
        , partition = data => {
            me.root = d3.hierarchy(data)
                    .sum(d => d.size)
                    .sort((a, b) => b.value - a.value);
            return d3.partition()
                    .size([2 * Math.PI, me.root.height + 1])
                    (me.root);
        };

		// init
		//console.log(me.data);
		me.root = partition(me.data);
		color = d3.scaleOrdinal().range(d3.quantize(d3.interpolateRainbow, me.data.children.length + 1));

		me.root.each(d => d.current = d);

		//ajoute le svg du menu
		svgMenu = me.cont.append("svg")
				.style("width", "96%")
				.style("height", "96%")
				.style("position","absolute")
				.attr('viewBox',"0 0 "+me.width+" "+me.width);
				//.style("font", "5px sans-serif");
				//.style("overflow-wrap", "break-word"); // does not work

		me.g = svgMenu.append("g")
				.attr("transform", `translate(${me.width / 2},${me.width / 2})`);

		me.path = me.g.append("g")
				.selectAll("path")
				.data(me.root.descendants().slice(1))
				.join("path")
				.attr("fill", d => {
					while (d.depth > 1)
						{ 
							d = d.parent;
						}
					d.color = d.data.color ? d.data.color : color(d.data.name);
					return d.color;
				})
				.attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 1 : 0.8) : 0)
				.attr("d", d => arc(d.current));

		/*le click uniqument sur cases avec des enfants
		me.path.filter(d => d.children)
				.style("cursor", "pointer")
				.on("click", clickOnArea);
		*/
		me.path.style("cursor", "pointer")
			.on("click", clickOnArea);

		me.path.append("title")
			.text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);            
		
		me.parent = me.g.append("circle")
			.datum(me.root)
			.attr("r", radius)
			.attr("fill", "none")
			.attr("pointer-events", "all")
			.on("click",clickOnArea);
		
		me.g.append("circle")
			.attr("r", radius/2)
			.attr("stroke", "black")
			.attr("stroke-width", "0.5")
			.attr("fill", "white")
			.attr("class", "validation")
			.style("cursor", "pointer")
			.on("click", clickOnValidate);
			
		me.g.append("text")
			.attr("text-anchor", "middle")
			.attr("alignment-baseline","middle")
			.style("cursor", "pointer")
			.text("SAVE")
			.on("click", function(d) {
				clickOnValidate(this, d);
			});
		
		var descendants = me.root.descendants().slice(1);
		
		var dataLabel = me.g.append("g")
				//.attr("pointer-events", "none")
				.attr("text-anchor", "middle")
				.style("user-select", "none");
		
		me.label = dataLabel
				.selectAll("text")
				.data(descendants)
				.join("text")
				.attr('class',d=>d.data.class)
				.attr("dy", "1em")
				.attr("fill-opacity", d => +labelVisible(d.current))
				.attr("transform", d => labelTransform(d.current))
				.text(d => d.data.name);		
		wrap(me.label, radius/6);
		
		me.checkboxes = dataLabel
				.selectAll("circle")
				.data(descendants)
				.join("circle")
				.attr("cx", "0")
				.attr("cy", "0")
				.attr("r", radiusBtn)
				.attr("stroke", "black")
				.attr("stroke-width", "0.5")
				.attr("fill", "white")
				.attr("class", "checkbox")
				.style("cursor", "pointer")
				.attr("display", d => checkboxVisible(d.current))
				.attr("transform", d => checkboxTransform(d.current))
				.on("click", clickedOnCheckbox);
				
		if(me.cbEndInit)call(me.cbEndInit);


		function measureTextWidth(text){
			const context = document.createElement("canvas").getContext("2d");
			return context.measureText(text).width;
		}

		function wrap(text, width) {
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
					if (measureTextWidth(tspan.text()) > width) {
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
		function arcVisible(d) {
			return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
		}
		function labelVisible(d) {
			return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
		}
		function labelTransform(d) {
			const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
			const y = (d.y0 + d.y1) / 2 * radius;
			return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
		}
		function checkboxVisible(d) {
			if (d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03)
				return "inline";
			else
				return "none";
		}
		function checkboxTransform(d) {
			const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
			const y = (d.y0 + d.y1) / 2 * radius;
			return `rotate(${x - 90}) translate(${y-30},0) rotate(${x < 180 ? 0 : 180})`;
		}
		function clickedOnCheckbox(e, data) {		
			var checkbox = d3.select(e.currentTarget);
			data.data.color = data.data.color ? data.data.color : data.parent.color;
			if (checkbox.attr("fill") == "white") {
				selectedItems.push(data);
				checkbox.attr("fill", "grey");
			} else {
				var index = selectedItems.indexOf(data);
				if (index >= 0)
					selectedItems.splice(index, 1);
				checkbox.attr("fill", "white");
			}
		}
		function clickOnValidate(e, data) {
			if(me.cbValidate)me.cbValidate(selectedItems);
		}
		function clickOnArea(e, data) {
			//si pas d'enfant on sort
			if (!data.children)
				return;
	
			me.parent.datum(data.parent || me.root);
	
			me.root.each(d => d.target = {
					x0: Math.max(0, Math.min(1, (d.x0 - data.x0) / (data.x1 - data.x0))) * 2 * Math.PI,
					x1: Math.max(0, Math.min(1, (d.x1 - data.x0) / (data.x1 - data.x0))) * 2 * Math.PI,
					y0: Math.max(0, d.y0 - data.depth),
					y1: Math.max(0, d.y1 - data.depth)
				});
	
			const t = me.g.transition().duration(750);
	
			// Transition the data on all arcs, even the ones that aren’t visible,
			// so that if this transition is interrupted, entering arcs will start
			// the next transition from the desired position.
			me.path.transition(t)
					.tween("data", d => {
						const i = d3.interpolate(d.current, d.target);
						return t => d.current = i(t);
					})
					.filter(function (d) {
						return +this.getAttribute("fill-opacity") || arcVisible(d.target);
					})
					.attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 1 : 0.8) : 0)
					.attrTween("d", d => () => arc(d.current));
	
			me.label.filter(function (d) {
					return +this.getAttribute("fill-opacity") || labelVisible(d.target);
				}).transition(t)
						.attr("fill-opacity", d => +labelVisible(d.target))
						.attrTween("transform", d => () => labelTransform(d.current));
						
			me.checkboxes.filter(function (d) {
					return +this.getAttribute("fill-opacity") || checkboxVisible(d.target);
				}).transition(t)
						.attr("display", d => checkboxVisible(d.target))
						.attrTween("transform", d => () => checkboxTransform(d.current));
		}
		function call(n){
			switch (n) {
				case 'show':
					show()
					break;
				case 'hide':
					hide()
					break;
				default:
					n();
					break;
			}
		}
		function show(){
			me.cont.style('display','block');
		}
		function hide(){
			me.cont.style('display','none');
		}
		this.showNew = function(){
			selectedItems=[];
			me.checkboxes.attr('fill','white');
			show();
		}
		this.showMenu = show;
		this.hideMenu = hide;
    }
}