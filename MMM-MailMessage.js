/* ****************************************************************************
 *
 * MMM-MailMessage
 *
 * This module looks for e-mails set to a specific address and displays the 
 * subject line on the MagicMirror².  
 *
 * It is heavily based on the MMM-Mail module by MMPieps found here:
 * https://github.com/MMPieps/MMM-Mail
 *
 * Author:	Roger Sinasohn (UncleRoger)
 * Written:	2023-11-01
 * Updated:	
 *
 * Change History
 * 2023-11-01	UncleRoger	Initial Release
 *
 *************************************************************************** */
 
 
Module.register("MMM-MailMessage",{
	defaults:{
		host:           '',
		port:           993,
		user:           '',
		pass:           '',
		subjectlength:  50,
		daysToDisplay:  0,
		msgsToDisplay:  2,
		colorImport:    "#ff0000",
		colorGood:      "#00ff00",
		colorWarn:      "#ffcc00",
		dispSender:     '',
		dispSendPunc:   " ",
	},
	messages: [],	//The storage for the Mails
	
	start: function(){
		console.log("Email module started!");
        this.sendSocketNotification('LISTEN_EMAIL',this.config);
        this.loaded = false;
	},
	
	socketNotificationReceived: function(notification, payload){
		if(payload.user==this.config.user)
		{
			if (notification === 'EMAIL_FETCH'){
				if(payload.messages){
					
					this.messages.length = 0; 	//clear Message storage
					console.log("Email-Fetch Event");
					
					this.messages = payload.messages;
					
					if(this.messages.length>0)
					{
						console.log(this.messages[0].id);
						this.messages.sort(function(a,b) {return b.id - a.id; });
					}
					this.updateDom(2000);
				}
			}
			if(notification === 'EMAIL_ERROR')
			{
				console.log("Email module restarted!");
				this.sendSocketNotification('LISTEN_EMAIL',this.config);
			}
		}
    },
	
	// Define required scripts.
    getStyles: function() {
        return ["email.css", "font-awesome.css"];
    },
	

//=============================================================================

	getDom: function(){
        var wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright pre-line";

// ! = Important (default = red), + = Good News (def = green), * = Warn (Def = Yellow/Orange)
		const MODIFIERS = [ "!", "+", "*" ]; 
		
        var that = this;

		if(this.messages.length > 0)
        {

//-----------------------------------------------------------------------------
//  We're using the slice method to get the first N messages where N is 
//  the msgsToDisplay option from the config file.  The default value is 2.

            this.messages.slice(0,this.config.msgsToDisplay).forEach(function (mailObj) {

                var subject = mailObj.subject.replace(/[\['"\]]+/g,"");

//				var daysOffset = that.config.daysToDisplay * -1;
//				var limitDate = moment().add(daysOffset, 'days');
//				var now = moment().add(5, 'days');

//  Here we calculate how many days ago the message was sent.  0 = today.
				var daysAgo = 0;
				daysAgo = moment().diff(mailObj.date, "days");

//  Now we go through the list of valid senders to make sure the message came
//  from someone allowed to post messages.  If not, we ignore it. 
				let selSender = that.config.validSenders.filter(mySender => {
					if (mySender.addr.toLowerCase() == mailObj.sender[0].address.toLowerCase()) 
						return true
					 else 
						return false
				});

//  If the sender was legit and it's not too old (or in the future), we start
//  building the message for display in messageWrapper.
				if (selSender.length > 0 && 
				   (daysAgo >= 0 && daysAgo <= that.config.daysToDisplay)          ) {

	                const messageWrapper = document.createElement("span");


//-----------------------------------------------------------------------------
//  Here we're going to see if we need to set the text to a color.  First, we
//  check any of the modifiers, !, +, and *.  If none of those are present, 
//  we'll check to see if the sender has an associated color.  If not, then 
//  we set it to the general text color.  Lastly, if there was a modifier, 
//  it gets removed via the substring method.
					var msgStat = subject.substring(0,1);
					switch (true) {
					  case (msgStat == "!"):
				        messageWrapper.style.color = that.config.colorImport;
				        break;
				      case (msgStat == "+"):
				        messageWrapper.style.color = that.config.colorGood;
				        break;
				      case (msgStat == "*"):
				        messageWrapper.style.color = that.config.colorWarn;
				        break;
				      case (selSender[0].color !== undefined):
						messageWrapper.style.color = selSender[0].color;
				        break;
					  case (that.config.colorText): 
						messageWrapper.style.color = that.config.colorText;
				        break;
					}
					if (MODIFIERS.includes(msgStat)) {
						subject = subject.substring(1,subject.length);
					}
					  

//-----------------------------------------------------------------------------
//  If a maximum length was set in the config, we'll trim the message to 
//  that length.  Note: we do this after removing the modifier but before
//  any other modifications (such as adding sender name).
					//cut the subject
					if(subject.length > that.config.subjectlength)
					{
						subject = subject.substring(0,that.config.subjectlength);
					}


//-----------------------------------------------------------------------------
//  If dispSender is set, we will prepend (= prefix) or append (= suffix) the 
//  sender name to the subject, along with the value of dispSendPunc.
					switch (that.config.dispSender.toLowerCase()) {
					  case "prefix":
					    if (selSender[0].name !== undefined) {
					    	subject = selSender[0].name + that.config.dispSendPunc + subject;
					    }
					    break;
					  case "suffix":
					  	if (selSender[0].name !== undefined) {
					    	subject = subject + that.config.dispSendPunc + selSender[0].name;
					    }
					    break;

					}

					
//  Now we bundle it all up to be displayed.
    	            messageWrapper.appendChild(document.createTextNode(subject));
    	               
    	            wrapper.appendChild(messageWrapper);

					// add a break
					wrapper.appendChild(document.createElement("BR"));

				}
            });
        }

		if (wrapper.children.length > 0) {
			wrapper.lastElementChild.remove();
		}

        return wrapper;
    }
});