/*
$(document).ready(() => {
	const query = {
		Selecione: ["Selecione"],
		Facebook: ["Selecione", "Curtidas", "Seguidores"],
		Twitter: ["Selecione", "Curtidas", "Seguidores", "Seguindo", "Tweets"],
		Instagram: ["Selecione", "Seguidores", "Seguindo", "Posts"],
		Youtube: ["Selecione", "Inscritos", "Videos"],
	};

	$query = $("#query option");

	$("#digitalMedia").on("change", function (event) {
		const digitalMedia = this.value;

		$query.each((index, el) => {
			if (query[digitalMedia].indexOf(el.value) == -1)
				{$(el).prop("disabled", true); } else { $(el).prop("disabled", false); }
		});

		
	}).change();
});
// */

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
    });
});

$(document).ready(() => {
	$("#queries").on("change", () => {
		let media = $("#queries").val();
		
        $("body").append("<br>Leu " + media + "<br>");
    });
});

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

let clear = (field) => {
	switch(field){
		case "queries": clearQueries(); break;
		case "categories": clearCategories(); break;
		case "actors": clearActors(); break;
	}
}

let clearQueries = () => {
	$("#queries").empty();
    $("#queries").prepend("<option value=''>Escolha...</option>");
}

let clearCategories = () => {
	$("#categories").empty();
}

let clearActors = () => {
	$("#actors").empty();
}

$(document).ready(() => {
	$("#categories").on("change", () => {
		let category = $("#categories").val();

        switch(category){
        	case "F/C": getActorsFC(); break;
            case "OSC": getActorsOSC(); break;
            case "CP": getActorsCP(); break;
            default: clear("categories");
        }
    });
});

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
		let check = "<input class='form-check-input' type='checkbox' id='" + actor.id + "'/>";
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
		let check = "<input class='form-check-input' type='checkbox' id='" + actor.id + "'/>";
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
		let check = "<input class='form-check-input' type='checkbox' id='" + actor.id + "'/>";
		$("#actors").append(check);
		check = "<label class='form-check-label' for='" + actor.id + "'>" + actor.name + "</label><br>";
		$("#actors").append(check);


	});
};

$(document).ready(() => {
	$("#clearActors").on("change", () => {
		$(".form-check-input").prop("checked", false);
		/*for (i=0;i<document.elements.length;i++) 
			if(document.elements[i].type == "checkbox") 
				document.elements[i].checked=0*/
	});
});

$(document).ready(() => {
	$("button").click(() => {
		// $("#test").hide();
		// $.get(URL, dados, callback);
		$.get("qualquer", (data, status) => {
			alert("texto: " + data.texto + "\nStatus: " + data.statusCod);
		});
	});
});

