/**
 * @name enyo
 * @namespace
 */

enyo.kind({
	name: "enyo.localize",
	kind: enyo.Object,
	/**
	 * Translation Module for Enyo
	 * @name enyo.localize
	 * @namespace
 	 * @version 2.1 (03/03/2012)
	 * @author MacFJA
	 * @type Object
	 */
	statics: {
		/** @lends enyo.localize */
		/**
		 * The source language (the developper language)
		 * @type String
		 * @default "en_US"
		*/
		source: "en_US",
		/**
		 * The destination language
		 * @type String
		 * @default "fr_FR"
		*/
		destination: "fr_FR",

		/**
		 * Internal attribute that contains all translations
		 * @private
		 * @type Object[]
		*/
		list: [],

		/**
		 * Return the list of available translation
		 * @returns List of translation
		 * @type Object[]
		 */
		getList : function() {
			return this.list;
		},

		/**
		 * Get user language from the navigator (for destination language)
		 * @returns Return <tt><strong>true</strong></tt> is a language is found, <tt><strong>false</strong></tt> otherwise
		 * @type Boolean
		 */
		autoDetectDestination: function() {//Get language from navigator (for destination language)
			if (navigator.browserLanguage)
				{ var language = navigator.browserLanguage; }//IE case :X
			else if(navigator.language)
				{ var language = navigator.language; }//Modern navigator case
			else {//An old navigator
				return false;
			}

			if(language.length == 2) {
				//only 2 letter format (i.e. "en", "fr", "es", "de", etc.)
				this.destination = language.toLowerCase();
				return true;
			}
			else if(language.length == 5 && language.indexOf("-") == 2) {
				//Standard navigator format (i.e. "en-us", "en-uk", "fr-fr", "fr-ca", "fr-be", etc.)
				this.destination = language.substr(0,2)+"_"+language.substr(3,2).toUpperCase();//set format from "xx-yy" to "xx_YY"
				return true;
			}
			else {//Unrecognized format
				return false;
			}
		},

		/**
		 * Add a group of translation
		 * @param {Object[]} newList The list of new translation
		 */
		addArray: function(newList) {
			for (var tour=0, size=newList.length; tour < size; tour++) {
				this.addLocalization(newList[tour]);
			};
		},

		/**
		 * Add a translation to the list
		 * @param {Object} item The new translation
		 */
		addLocalization: function(item) {
			this.list.push(item);
		},

		/**
		 * Search and select the right plural form of a given text
		 * @private
		 * @param {String} data The give text
		 * @param {Object} [context] JSON object that contains variables
		 * @returns The transformed text
		 * @type String
		*/
		pluralSearch: function(data, context) {
			var re = /\{\$\w+\|.[^}]+\}/g;//RegEx search for {$something|another thing}
			var search = re.exec(data);

			if(!search)//Plural don't exist
				{ return data; }

			var plural = search[0];

			//Separate base and each case
			var list = plural.split("|");

			//Remove the first "{"
			list[0] = list[0].substring(1);
			//Remove the last "}"
			var item = list[list.length-1];
			list[list.length-1] = item.substring(0, item.length-1);

			//Get the context value (set to "*" if no context found)
			if(!context || !context.length)
				{ var cValue = "*"; }
			else
				{ var cValue = (!context[list[0].substring(1)])?"*":context[list[0].substring(1)]; }


			//Extract the number
			for (var tour=1, size=list.length; tour < size; tour++) {
				var infos = list[tour].split(":");
				list[tour] = {"id": infos[0], "text": infos[1]};
			};

			//Replace $obj by {$obj} in all fields
			var re = new RegExp("\\"+list[0], "g");
			for (var tour=1, size=list.length; tour < size; tour++) {
				var item = list[tour].text;
				list[tour].text = item.replace(re, "{"+list[0]+"}");
			};

			//Select the good choice
			var choice = "";
			for (var tour=1, size=list.length; tour < size; tour++) {
				if(list[tour].id == cValue) {
					choice = list[tour].text;
				}
			};

			if(!choice) {
				//If we are here, then search for "*" choice
				for (var tour=1, size=list.length; tour < size; tour++) {
					if(list[tour].id == "*") {
						choice = list[tour].text;
					}
				};
			}
			//Update the source
			data = data.substring(0, data.indexOf(plural))+choice+data.substring(data.indexOf(plural)+plural.length);

			return this.pluralSearch(data, context);
		}
	}
})

/**
 * Search, translate and apply transformation to a text
 * @param {String} source The text to translate
 * @param {Object} [context] JSON object that contains variables
 * @returns The translated text
 * @type String
 * @requires <tt><strong>enyo.localize</strong></tt>
 */
enyo.T = function(source, context) {
	var longSource = enyo.localize.source,//Long language format ("xx_YY")
		shortSource = longSource.substr(0,2),//Short language format ("xx")

		longDest = enyo.localize.destination,//Long language format ("xx_YY")
		shortDest = longDest.substr(0,2),//Short language format ("xx")

		resultat = source,
		tour = 0,
		list = enyo.localize.getList(),
		size = list.length,

		translatedType = 0;

	for(;tour < size; tour++) {
		var item = list[tour];
		//Search source translation
		if(
			source == item[longSource] ||
			source == item[shortSource] ||
			source == item["key"]
		) {//In Long or short format or special key
			//Select the good translation
			if(item[longDest]) {
				//Select the long language format (more precise)
				resultat = item[longDest];
				translatedType = 5;
				break;//The best translation, don't need to go further
			}
			else if(item[shortDest]) {//in short if exist and long don't
				//Select the short language format
				resultat = item[shortDest];
				translatedType = 4;
			}
			else if(translatedType < 3 && item["default"]){
				//No long or short format language, the language don't have translation, take the default value
				resultat = item["default"];
				translatedType = 3;
			}
			else if(translatedType < 2 && item[longSource]){
				//If no default found, select the source (long)
				resultat = item[longSource];
				translatedType = 2;
			}
			else if(translatedType < 1 && item[shortSource]){
				//If no default found, select the source (short)
				resultat = item[shortSource];
				translatedType = 1;
			}
		}
	}

	//Send an alert if needed.
	switch(translatedType) {
		case 0: enyo.error("No translation for \""+source+"\" in \""+longDest+"\""); break;
		case 1: enyo.warn("No translation for \""+source+"\" in \""+longDest+"\", select source translation (\""+shortSource+"\")"); break;
		case 2: enyo.warn("No translation for \""+source+"\" in \""+longDest+"\", select source translation (\""+longSource+"\")"); break;
		case 3: enyo.warn("No translation for \""+source+"\" in \""+longDest+"\", select default translation"); break;
	}

	resultat = enyo.localize.pluralSearch(resultat, context);//Search and transform plural form
	return enyo.macroize(resultat, context);
}