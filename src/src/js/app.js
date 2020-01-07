const ether = 10**18;
App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
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

  initContract: function() {
    $.getJSON("ItemMarket.json", function(itemMarket) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.ItemMarket = TruffleContract(itemMarket);
      // Connect provider to interact with contract
      App.contracts.ItemMarket.setProvider(App.web3Provider);

      return App.render();
    });
  },

  render: function() {
    var itemMarketInstance;
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

    // Load contract data
    App.contracts.ItemMarket.deployed().then(function(instance){
      itemMarketInstance = instance;
      return itemMarketInstance.itemCount();
    }).then(function(count){
        var itemsResults = $("#itemsResults");
        var requestResults = $("#requestList");
        var approvalResults = $("#approvalList");
        itemsResults.empty();
        requestResults.empty();
        console.log(count);
        for (var i=1;i<=count;i++){
          itemMarketInstance.itemList(i).then(function(item){
            var id = item[0];
            var name = item[1];
            var desc = item[2];
            var price = item[3];
            var owner = item[4];
            var requester =item[5];
            
            var trfbtn = document.createElement('button');
            trfbtn.innerText = 'Transfer';

            var btn = document.createElement('button');
            btn.innerText = 'Request';

            var approvebtn = document.createElement('button');
            approvebtn.innerText = 'Approve';

            if(requester==App.account){
              var requestTemplate = "<tr><td>"+name+"</td><td>"+desc+"</td><td>"+price+" ETH</td><td>"+owner+"</td><td>"+item[7]+"</td</tr>"
              requestResults.append(requestTemplate);
              if(item[7]=="Approved"){
                requestResults.append(trfbtn);
              }
            }
            
            var itemTemplate = "<tr><td>"+name+"</td><td>"+desc+"</td><td>"+price+" ETH</td><td>"+owner+"</td></tr>"
            
           

           

            if(owner==App.account||item[6]){
              btn.disabled=true;

            }
            btn.addEventListener('click', function() {
              itemMarketInstance.requestItem(id);
            });
            
            approvebtn.addEventListener('click', function() {
              itemMarketInstance.approve(id);
            });

            trfbtn.addEventListener('click', function() {
              const deposit = price*ether;
              itemMarketInstance.deposit({from:App.account,value:deposit});
              console.log(owner);
              itemMarketInstance.transferEther(owner,id);
            });

            if (owner==App.account){
              if(item[6]){
                var approvalTemplate = "<tr><td>"+name+"</td><td>"+desc+"</td><td>"+price+" ETH</td><td>"+item[7]+"</td</tr>"
                approvalResults.append(approvalTemplate);
                if(item[7]!=="Approved"){
                  approvalResults.append(approvebtn);
                }

              }
            }

            itemsResults.append(itemTemplate);
            itemsResults.append(btn);

          });
        }
        

        loader.hide();
        content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },
  itemAdd : function() {
    var name = $("#nameInput").val();
    var desc = $("#descInput").val();
    var price = $("#priceInput").val();

    App.contracts.ItemMarket.deployed().then(function(instance){
        return instance.addItem(name,desc,price,{from:App.account});
    }).then(function(result){
      $('#content').hide();
      $('#loader').show();

    }).catch(function(err){
      console.error(err);
    });
  }
};


$(function() {
  $(window).load(function() {
    ethereum.enable();
    App.init();
  });
});