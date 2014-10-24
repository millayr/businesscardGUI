$( document ).ready(function() {
   
   $( "#name" ).val("");
   $( "#language" ).val("");
   $( "#product" ).val("");
   $( "#country" ).val("");
   $( "#state" ).val("");
   $( "#lat" ).val("");
   $( "#long" ).val("");

   var baseUrl = "https://" + user + ":" + pwd + "@" + account + ".cloudant.com/" + db;

   // search indexes
   var searchUrl = baseUrl + "/_design/app/_search/searchAll";
   var primaryIndex = baseUrl + "/_all_docs";

   search();

   function errorHandler(jqXHR, textStatus, errorThrown) {
      alert(JSON.stringify(jqXHR, null, 2));
   }

   // on search
   $( "#search" ).click(function( event ) {
      search();
   });

   function search() {
      var name = $( "#name" ).val();
      var lang = $( "#language" ).val();
      var product = $( "#product" ).val();
      var country = $( "#country" ).val();
      var state = $( "#state" ).val();
      var lat = $( "#lat" ).val();
      var lon = $( "#long" ).val();

      var geo = false;

      if((lat && !lon) || (lon && !lat)) {
         alert("You must enter both a latitude and longitude.");
         return;
      }

      if(lat && lon)
         geo = true;

      var query = buildQuery(name, lang, product, country, state, lat, lon);

      $.ajax({
         url: query,
         type: "GET",
         error: errorHandler
      }).done(function( data ) {
         buildCards(JSON.parse(data), geo);
      });
   }

   // build the query to the search index
   function buildQuery(name, lang, product, country, state, lat, lon) {
      var query = searchUrl + "?q=";
      var parameters = [];

      if(name)
         parameters.push("name:" + name);
      if(lang)
         parameters.push("language:" + lang);
      if(product)
         parameters.push("product:" + product);
      if(country)
         parameters.push("country:" + country);
      if(state)
         parameters.push("state:" + state);


      if(parameters.length > 0) {
         $.each(parameters, function(index, value) {
            if(index == parameters.length - 1)
               query += value;
            else
               query += value + " AND ";
         });
      } else {
         query += "*:*";
      }


      if(lat && lon)
         query += "&sort=%22%3Cdistance,long,lat," + lon + "," + lat + ",mi%3E%22";

      // add the include_docs parameter
      query += "&include_docs=true&limit=200";

      return query;
   }


   function buildCards(obj, geo) {
      // first thing is remove all previous cards
      $( "#cards" ).empty();
      var rows = obj.rows;

      if(rows.length == 0) {
         $( "#cards" ).append('<div id="noresults" class="result"></div>');
         $( "#noresults" ).append('<br/><p><b>No Results Located</b></p><br/><br/>');
         $( "#noresults" ).append('<img src="cloudant.png" width="150px">');
      } else {
         $( "#cards" ).append('<div id="counts"><p><b>Total Results: ' + rows.length + '</b></p></div>');
         $.each(rows, function(index, data){

            // build the address string
            var address = data.doc.address.city + ", ";
            if(data.doc.address.state)
               address += data.doc.address.state + " ";
            address += data.doc.address.country;

            // build the product string
            var products = data.doc.products;
            var product_list = "<b>Products: </b>";
            $.each(products, function(i, product) {
               if(i == products.length - 1)
                  product_list += product;
               else
                  product_list += product + ", ";
            });

            // build the language string
            var languages = data.doc.languages;
            var language_list = "<b>Languages: </b>";
            $.each(languages, function(i, language) {
               if(i == languages.length - 1)
                  language_list += language;
               else
                  language_list += language + ", ";
            });

            // start appending elements to the DOM
            $( "#cards" ).append('<div id="' + index + '" class="result"></div>');
            $( "#" + index ).append('<p><a href="' + data.doc.BluePages + '" target="_blank">' + data.doc.name + '</a><br/>' +
                                    data.doc.title + '<br/>' +
                                    address + '</p>');
            $( "#" + index ).append('<p>' + product_list + '</p>');
            $( "#" + index ).append('<p>' + language_list + '</p>');

            if(geo)
               $( "#" + index ).append('<p><b>Distance: </b>' + data.order[0].toFixed(2) + ' miles</p>');

            $( "#" + index ).append('<img src="cloudant.png" width="150px">');
         });
      }

      // chrome hack to redraw the cards div to ensure it is properly rendered.
      $( "#cards" ).hide().show(0);
   }
});