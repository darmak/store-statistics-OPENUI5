sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, ODataModel, JSONModel) {
	"use strict";

	return UIComponent.extend("dmitry.buravkin.Component", {
		metadata: {
			manifest: "json"
		},

		init : function () {
			UIComponent.prototype.init.apply(this, arguments);
			var oStatusViewModel = new JSONModel();
			this.setModel(oStatusViewModel, "appView");
			this.getRouter().initialize();
		}
	});
});