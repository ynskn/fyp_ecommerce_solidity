const ether = 10**18;
App ={
    web3Provider: null,
    contracts: {},
    account: '0x0',

    init: function(){
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== 'undefined') {
          // If a web3 instance is already provided by Meta Mask.
          App.web3Provider = web3.currentProvider;
          web3 = new Web3(web3.currentProvider);
        } else {
          // Specify default instance if no web3 instance provided
          App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
          web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
      },

      initContract: function(){
        $.getJSON("TicketMarket.json", function(ticketMarket) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.TicketMarket = TruffleContract(ticketMarket);
            // Connect provider to interact with contract
            App.contracts.TicketMarket.setProvider(App.web3Provider);
            return App.render();
          });
      },
      render: function(){
        var ticketInstance;
        var loader = $("#loader");
        var content = $("#content");
    
        loader.show();
        content.hide();
        // Load account data
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
            App.account = account;
            $("#accountAddress").html("Your Account: " + account);
            web3.eth.getBalance(account,function(err,balance){
                $("#accountBalance").html("Your Balance: "+web3.fromWei(balance)+" ETH");
            });        
            }
        });

        App.contracts.TicketMarket.deployed().then(function(instance){
            ticketInstance = instance;
            return ticketInstance.eventCount();
        }).then(function(count){
            var eventResult = $("#eventResults");
            eventResult.empty();

            for (var i=0; i<=count; i++){
                ticketInstance.eventList(i).then(function(event){
                    var name = event[1];
                    var desc = event[2];
                    var stock = event[3];
                    var price = event[4];
                    var status = event[5];
                    var creator = event[6];
                    var balance = event[7];
                    console.log(balance);
                    if(name!=""){
                        var buyTicketbtn = document.createElement("button");
                        buyTicketbtn.innerText = "Buy Ticket";
                        buyTicketbtn.addEventListener('click',function(){
                            ticketInstance.deposit({from:App.account,value:price*ether});
                            ticketInstance.buyTicket(event[0]);
                        
                        });

                        var endbtn = document.createElement("button");
                        endbtn.innerText = "End";
                        endbtn.addEventListener('click',function(){
                            ticketInstance.transferEther(creator,balance*ether);
                        
                        });
                        
                        var eventTemplate = "<tr><td>"+name+"</td><td>"+desc+"</td><td>"+stock+"</td><td>"+price+"</td><td>"+status+"</td><td>"+creator+"</td></tr>";
                        eventResult.append(eventTemplate);
                        if(creator!=App.account && stock!=0){
                            eventResult.append(buyTicketbtn);
                        }
                        if(creator==App.account){
                            eventResult.append(endbtn);
                        }
                    }
                })
            }

        })

        loader.hide();
        content.show();
      }


}
$(function() {
    $(window).load(function() {
      ethereum.enable();
      App.init();
    });
  });