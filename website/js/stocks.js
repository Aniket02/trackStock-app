/*  My final project is a web app to track stocks listed on the NYSE and NASDAQ stock exchanges, with data being extracted from IEXTrading API. For each stock,
   the relevant news articles are also gathered with the help of the News API. The user can also delete stocks already added and refresh the stock data for
   stocks being tracked (time stamp is shown). Stock data for each stock can be minimized or maximized as well. The header provides volumes being traded in each exchange, and the volume data keeps getting refreshed every minute.
   The stocks will be recalled from local storage when the user refreshes the webpage. 

   @author: Aniket Shah
*/

window.onload = function(){

    // Load the stock symbols for which the API provides data, into the dropdown list with the help of the select2 library. 
    $.getJSON("https://api.iextrading.com/1.0/ref-data/symbols", function (data){
        var loop = [];
        
        for(var i = 0; i < data.length ; i++){
            loop.push({id:i , text: data[i].symbol});
        }

        $(".js-example-data-array").select2({
            placeholder: 'Add/Remove Stock Symbol',
            allowClear: true,
            data: loop
        })
    });



     /* Refresh the volume traded on each stock exchange (NASDAQ and NYSE) every minuite. 
        The time stamp shown is when the volume data was last updated in the API. */
     (function worker() {
        $.getJSON({
          url: "https://api.iextrading.com/1.0/market?filter=venueName,volume,lastUpdated", 
          success: function(data) {
            $("#NASDAQ .volume").html(data[1].volume);
            $("#NASDAQ .time").html(new Date(data[1].lastUpdated).toLocaleString());
            $("#NYSE .volume").html(data[2].volume);
            $("#NYSE .time").html(new Date(data[2].lastUpdated).toLocaleString());
          },
          complete: function() {
            // Schedule the next request 60 seconds later, only after the current one is completed.
            setTimeout(worker, 60000);
          }
        });
      })();

      /* When a page is revisited, load the stockList array already residing in localStorage.
         If none residing, initialize an empty array. */ 
      var currentList = JSON.parse(localStorage.getItem('stocks'));
      if (typeof currentList !== 'undefined' && currentList !== null){
          var stockList = currentList;
      } else{
          var stockList = [];
      }
      
      /* For each stock in stockList, create a stock specific div, and get the relevant data.*/
      for (let i = 0; i < stockList.length; i++){
          duplicate(stockList[i]);
          getData(stockList[i]);
      }

      $(".stock-data").hide();
      
      /* The below function is called when a user selects a specific stock from the dropdown list, and clicks add to track the stock. */
      $("#add").click(function(){
          var selected_stock = $(".js-example-data-array").select2('data')[0].text;
          var repeating = false;
          // If the stock has already been added to the list, display an alert box notifying the user.
          for (let i = 0; i < stockList.length; i++){
            if (selected_stock == stockList[i]) {
                alert("The Stock Symbol selected has already  added!");
                repeating = true;
            }
          }

          /* If no stock has been selected, display an alert box notifying the user.
             Otherwise, append the stock to stockList array, call the duplicate function, call the getData function, and then update the 
             stockList array in localStorage */
          if (selected_stock == "") {
              alert("No stock symbol selected, please click on the desired symbol first.");
            } else if (!repeating){
            stockList.push(selected_stock);    
            duplicate(selected_stock);
            getData(selected_stock);
            var stockListItem = "stock-" + selected_stock;
            for (let i = 0; i < stockList.length-1; i++){
                $( "#" + "stock-" + stockList[i] + " .stockTitle" + " #toggle").html("[+]");
                $( "#" + "stock-" + stockList[i] + " .stock-data").hide();
            }
            $("#" + stockListItem + " .stock-data").show("fast","swing");
            $("#" + stockListItem + " .stockTitle" + " #toggle").html("[-]");
            updateStorage();       
            }
      })

      // This function is called when a user clicks [+]/[-] to maximizie/minimize the stock data
      $(".container").on( 'click', '#toggle', function(){
        var stockData = $(this).parent().parent().children('.stock-data');
        var toggleSymbol = $(this).parent().parent().children().children('#toggle');
          if (stockData.css('display') == 'none') {
              //$('.stock-data').hide();
              stockData.show("fast","swing");
              toggleSymbol.html("[-]");
          } else {
              stockData.hide("fast","swing");
              toggleSymbol.html("[+]");
          }
      })

      // When a user clicks on the 'delete' button, the specific stock is deleted from the stocks section, and removed from the stockList Array.
      $(".container").on( 'click', '#del', function(){
        var removeId = $(this).parents().eq(1).prop('id');
        $("#" + removeId).remove();
        var removeStock = removeId.substring(6);
        stockList = stockList.filter(val => val !== removeStock);
        // stockList updated in localStorage
        updateStorage();
      })

      // When a user clicks on the 'refresh' button for any of the stocks, the specific stock data is refreshed, fetching the latest data.
      $(".container").on('click', '#ref', function(){
          var refreshId = $(this).parents().eq(1).prop('id');
          var refreshStock = refreshId.substring(6);
          getData(refreshStock);
      })

      // The update function below updates the 'stocks' key in the localStorage with the latest stockList array.
      function updateStorage(){
        localStorage.setItem('stocks', JSON.stringify(stockList));
      }
      
      /* The function below duplicates a div similar to 'stock-template' div defined in the HTML, and appends it to the stocks section,
        it gives the new div a unique id stock-'stockName' */
      function duplicate(stockName1) {
        var template = document.getElementById('stock-template');
        stockDuplicate = template.cloneNode(true); // creating a deep clone of 'stock-template'
        stockDuplicate.id = "stock-" + stockName1; // there can only be one element with a unique ID 
        template.parentNode.appendChild(stockDuplicate);              
      }

      /* The function below gets the relevant data for a given stock through Ajax calls, and populates it in the relevant
         div 'stock-(stockName)' */
      function getData(stockName){
        
        var stockTag = "stock-" + stockName;
        
        // Generating URL's on which Ajax calls will be made
        var companyInfoURL = "https://api.iextrading.com/1.0/stock/" + stockName + "/company";
        var financeInfoURL = "https://api.iextrading.com/1.0/stock/" + stockName + "/financials";
        var quoteInfoURL = "https://api.iextrading.com/1.0/stock/" + stockName + "/quote";
        
        //Displaying the current time, tells the user when the data was last fetched
        var currentTime = new Date().getTime();
        var currentDate = new Date(currentTime);
        $( "#" + stockTag + " .time").html(currentDate.toLocaleString()); 
        
        //Populating the Stock title
        $( "#" + stockTag + " #stockHeading").html(stockName); 
        
        // Getting company information for the specific stock
        $.getJSON({
            url: companyInfoURL, 
            success: function(data) {
                $( "#" + stockTag + " #symbol").html(data.symbol);
                $( "#" + stockTag + "  #companyName").html(data.companyName);
                $( "#" + stockTag + "  #industry").html(data.industry);
                $( "#" + stockTag + " #website").html(data.website);
                $( "#" + stockTag + " #website").attr("href", data.website );
                $( "#" + stockTag + " #issueType").html(data.issueType);
                $( "#" + stockTag + " #ceo").html(data.CEO);
                $( "#" + stockTag + " #sector").html(data.sector);
                $( "#" + stockTag + " #exchange").html(data.exchange);
               
                // Identifying the company name to determine the query term for News API call
                var query = data.companyName;
                var queryArray = query.split(" ");

                /* If the company name is long, it's best to use the stock symbol as the query term,
                  instead of the company name as too many words combined will not lead to any search results.
                   If the company name is short (less than three words), it's best to take the first term as the 
                  query term as the second and third words are usually 'holding', 'corporation', 'inc.' etc., 
                  which don't help. */

                if (queryArray.length > 3){
                    var queryTerm = data.symbol;
                }else{
                    var queryTerm = queryArray[0];
                }
                
                var apiKey = "419c23ced40b4c5b9f22b7083e86c585";
                var newsURL = "https://newsapi.org/v2/everything?q=" + queryTerm + "&sortBy=popularity" + "&apiKey=" + apiKey;
                
                // Getting the top 8 most popular articles regarding the company.
                $.getJSON({
                    url: newsURL,
                    success: function(data) {
                        
                        /* If the search results in more than 8 articles, the loop below will take the first 8 and break the loop.
                           If no results are returned, the no articles will be shown. */ 
                        if (data.articles.length > 0){
                            for (let i = 0; i < data.articles.length; i++){
                                $( "#" + stockTag + " #link-" + i).html(data.articles[i].title);
                                $( "#" + stockTag + " #link-" + i).attr("href", data.articles[i].url);
                                if (i >= 7) break;
                            }
                        } else {
                            $( "#" + stockTag + " #link-" + 0).html("No articles found amongst the top sources");
                        }
                    }
                })
            }})
        
        
        // Getting financial report information for the specific stock
        $.getJSON({
            url: financeInfoURL, 
            success: function(data) {
                $( "#" + stockTag + " #totalRevenue").html(numeral(data.financials[0].totalRevenue).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #grossProfit").html(numeral(data.financials[0].grossProfit).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #operatingIncome").html(numeral(data.financials[0].operatingIncome).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #netIncome").html(numeral(data.financials[0].netIncome).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #rd").html(numeral(data.financials[0].researchAndDevelopment).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #liabilities").html(numeral(data.financials[0].totalLiabilities).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #assets").html(numeral(data.financials[0].totalAssets).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #report").html(data.financials[0].reportDate);
                
            }})
        
        // Getting quote information for the specific stock
        $.getJSON({
            url: quoteInfoURL, 
            success: function(data) {
                $( "#" + stockTag + " #latestPrice").html(numeral(data.latestPrice).format('($ 0.00)'));
                $( "#" + stockTag + " #latestVolume").html(data.latestVolume);
                $( "#" + stockTag + " #latestUpdate").html(new Date(data.latestUpdate).toLocaleDateString());
                $( "#" + stockTag + " #peRatio").html(data.peRatio);
                $( "#" + stockTag + " #week52High").html(numeral(data.week52High).format('($ 0.00)'));
                $( "#" + stockTag + " #week52Low").html(numeral(data.week52Low).format('($ 0.00)'));
                $( "#" + stockTag + " #marketCap").html(numeral(data.marketCap).format('($ 0.0000 a)'));
                $( "#" + stockTag + " #ytdChange").html(numeral(data.ytdChange).format('0.00%'));
            }})
      }
};