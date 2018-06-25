/**
 * Definition of the aspects of analysis dependent on the digital media chosen
 */
$(document).ready(() => {
	$("#digitalMedia").on("change", () => {
		let media = $("#digitalMedia").val();

		restart("queries");

		if(media) {
			$("#queries").attr("disabled", false);
			$("#categories").attr("disabled", false);
			getQueries(media);
		}
	});
});

/**
 * Definition of the actors depending on the chosen category
 */
$(document).ready(() => {
	$("#categories").on("change", () => {
		let category = $("#categories").val();
		let media = $("#digitalMedia").val();

		restart("actors");
		if(category) {
			getActors(media, category);
		}else{
			$("#actors").append("<p class='text-center'>Não há categoria selecionada</p>");
		}

    });
});

/**
 * Deselect all possible marked actors
 */
$(document).ready(() => {
	$("#clearActors").on("change", () => {
		$(".form-check-input").prop("checked", false);
	});
});

/**
 * Request the desired data
 */
$(document).ready(() => {
	$("#search").click(() => {
		let media = $("#digitalMedia").val();
		let query = $("#queries").val();
		const actors = getMarkedActors();

		if(!media || !query || !actors.length)	
			alert("Deve ter selecionado todos os campos!");
		else {
			let URL = getURL (media, query, actors);
			const chartArea = document.getElementById("chartArea");// $("#chartArea");
			$.get(URL, (chart) => {
				const myChart = new Chart (chartArea, chart);
			});
		}
	});
});

/**
 * Acquisition of queries for a given digital media
 * @param {string} media - Selected digital media
 */
let getQueries = (media) => {
	let URL = "/" + media + "/queries";

	$.get(URL, (queries, status) => {
		queries.forEach((query) => {
			let cmd = "<option value='" + query.val +  "'>";
			cmd += query.name + "</option>";
			$("#queries").append(cmd);
		});
	});
};

/**
 * Acquisition of registered actors in a given category
 * @param {string} category - Selected actors' category
 */
let getActors = (media, category) => {
	let URL = "/" + media + "/actors/" + category;

	$.get(URL, (actors, status) => {
		actors.forEach((actor) => {
			if (actor.ID){
				let cmd = "<input class='form-check-input' type='checkbox' value='" + actor.ID + "'/>";
				$("#actors").append(cmd);
				cmd = "<label class='form-check-label' for='" + actor.ID + "'>" + actor.name + "</label><br>";
				$("#actors").append(cmd);
			}
		});
	});
};

/**
 * Acquisition of all chosen actors
 */
let getMarkedActors = () => {
	var actores = [];

	$(".form-check-input:checked").each(function() {
		if($(this).val())
		actores.push($(this).val());
	});

	return actores;
};

/**
 * URL construction for the chart data
 * @param {string} media - Selected digital media
 * @param {string} query - Selected query
 * @param {string} actors - One or more selected actors
 */
let getURL = (media, query, actors) => {
	const length = actors.length;
	let URL = "/" + media + "/";

	if(length == 1)
		URL += actors + "/" + query;

	else {
		URL += "compare/" + query + "?actors=";

		for (let cActor = 0; cActor < length; cActor += 1) {
			URL += actors[cActor];

			if (cActor < length - 1)
				URL += ",";
		}
	}
	return URL;
};

/**
 * Restart of a given control field
 * @param {string} field - Field to restart
 */
let restart = (field) => {
	switch(field){
		case "queries": restartQueries(); break;
		case "actors": restartActors(); break;
	}
};

/**
 * Restart the queries field
 */
let restartQueries = () => {
	$("#queries").attr("disabled", true);
	$("#categories").attr("disabled", true);
	$("#queries").empty();
    $("#queries").prepend("<option value=''>Escolha...</option>");
};

/**
 * Restart the actors field
 */
let restartActors = () => {
	$("#actors").empty();
};
