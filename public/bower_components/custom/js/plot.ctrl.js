/**
 * Definition of the aspects of analysis dependent on the digital media chosen
 */
$(document).ready(() => {
	$("#digitalMedia").on("change", () => {
		let media = $("#digitalMedia").val();

		switch(media){
        	case "facebook": facebookQueries(); break;
            case "instagram": instagramQueries(); break;
            case "twitter": twitterQueries(); break;
            case "youtube": youtubeQueries(); break;
            default: clear("queries");
		}

		/*
		clear("queries");

		if(media) {
			$("body").append("Leu: " + media + "<br>");
			getQueries(media);
		}
		*/
	});
});

/**
 * Definition of the actors depending on the chosen category
 */
$(document).ready(() => {
	$("#categories").on("change", () => {
		let category = $("#categories").val();

        switch(category){
        	case "FC": getActorsFC(); break;
            case "OSC": getActorsOSC(); break;
			case "PCP": getActorsCP(); break;
			default: clear("actors");
		}

		/*
		clear("actors");
		if(category) {
			$("body").append("Leu: " + category + "<br>");
			getActors(category);
		}
		//*/
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
		
		$("body").append("Media: " + media + "<br>");
		$("body").append("Query: " + query + "<br>");
		$("body").append("Actors: " + actors + "<br><br>");

		if(!media || !query || !actors.length)	
			alert("Deve ter selecionado todos os campos!");
		else {
			let URL = getURL (media, query, actors);
			$("body").append("Requisitando: " + URL + "<br>");
		}
	});
});

let getQueries = (media) => {
	let URL = "/config/" + media + "/queries";

	$("body").append("Indo buscar em: " + URL + "<br>");

	/*
	$.get(URL, (queries, status) => {
		queries.forEach((query) => {
			let cmd = "<option value='" + query.name +  "'>";
			cmd += query.namePT + "</option>";
			$("#queries").append(cmd);
		});
	});
	// */
};

let getActors = (category) => {
	let URL = "/config/" + category;

	//$("body").append("Indo buscar em: " + URL + "<br>");

	/*
	$.get(URL, (actors, status) => {
		actors.forEach((actor) => {
			let cmd = "<input class='form-check-input' type='checkbox' value='" + actor.id + "'/>";
			$("#actors").append(cmd);
			cmd = "<label class='form-check-label' for='" + actor.id + "'>" + actor.name + "</label><br>";
			$("#actors").append(cmd);
		});
	});
	// */
};

let getMarkedActors = () => {
	var actores = [];

	$(".form-check-input:checked").each(function() {
		if($(this).val())
		actores.push($(this).val());
	});

	return actores;
};

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

let clear = (field) => {
	switch(field){
		case "queries": clearQueries(); break;
		case "categories": clearCategories(); break;
		case "actors": clearActors(); break;
	}
};

let clearQueries = () => {
	$("#queries").empty();
    $("#queries").prepend("<option value=''>Escolha...</option>");
};

let clearCategories = () => {
	$("#categories").empty();
};

let clearActors = () => {
	$("#actors").empty();
};

let getActorsFC = () => {
	clear("actors");

	let actors = [
		{
			name: "Ator 0",
			id: "id_0",
		},
		{
			name: "Ator 1",
			id: "id_1",
		},
		{
			name: "Ator 2",
			id: "id_2",
		},
	];

	// get(atores)

	actors.forEach((actor) => {
		let check = "<input class='form-check-input' type='checkbox' value='" + actor.id + "'/>";
		$("#actors").append(check);
		check = "<label class='form-check-label' for='" + actor.id + "'>" + actor.name + "</label><br>";
		$("#actors").append(check);


	});
};

let getActorsOSC = () => {
	clear("actors");

	let actors = [
		{
			name: "Ator 3",
			id: "id_3",
		},
		{
			name: "Ator 4",
			id: "id_4",
		},
		{
			name: "Ator 5",
			id: "id_5",
		},
	];

	// get(atores)

	actors.forEach((actor) => {
		let check = "<input class='form-check-input' type='checkbox' value='" + actor.id + "'/>";
		$("#actors").append(check);
		check = "<label class='form-check-label' for='" + actor.id + "'>" + actor.name + "</label><br>";
		$("#actors").append(check);


	});
};

let getActorsCP = () => {
	clear("actors");

	let actors = [
		{
			name: "Ator 6",
			id: "id_6",
		},
		{
			name: "Ator 7",
			id: "id_7",
		},
		{
			name: "Ator 8",
			id: "id_8",
		},
	];

	// get(atores)

	actors.forEach((actor) => {
		let check = "<input class='form-check-input' type='checkbox' value='" + actor.id + "'/>";
		$("#actors").append(check);
		check = "<label class='form-check-label' for='" + actor.id + "'>" + actor.name + "</label><br>";
		$("#actors").append(check);


	});
};

let facebookQueries = () => {
	clear("queries");
	$("#queries").append("<option value='likes'>Curtidas</option>");
    $("#queries").append("<option value='followers'>Seguidores</option>");
}

let instagramQueries = () => {
	clear("queries");
	$("#queries").append("<option value='followers'>Seguidores</option>"); 
    $("#queries").append("<option value='following'>Seguindo</option>");
    $("#queries").append("<option value='num_of_posts'>Postagens</option>");
}

let twitterQueries = () => {
	clear("queries");
	$("#queries").append("<option value='tweets'>Tweets</option>");
    $("#queries").append("<option value='followers'>Seguidores</option>");
    $("#queries").append("<option value='following'>Seguindo</option>");
    $("#queries").append("<option value='likes'>Curtidas</option>");
    $("#queries").append("<option value='moments'>Momentos</option>");
}

let youtubeQueries = () => {
	clear("queries");
	$("#queries").append("<option value='videos'>Vídeos</option>");
    $("#queries").append("<option value='views'>Visualizações</option>");
    $("#queries").append("<option value='subscribers'>Inscritos</option>");
}