sap.ui.define([
    "dmitry/buravkin/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
], function (BaseController, Filter, FilterOperator, Sorter, MessageToast) {
	"use strict";
    var sProductID;

	return BaseController.extend("dmitry.buravkin.controller.ProductDetails", {
        /**
         * Controller`s "init" lifecycle method.
         */
		onInit: function() {
			var oComponent = this.getOwnerComponent();
			var oRouter = oComponent.getRouter();
			oRouter.getRoute("ProductDetails").attachPatternMatched(this.onPatternMatched, this);
		},

        /**
         * Provides information about current product.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
		onPatternMatched: function (oEvent) {
			var that = this;
			var mRouteArguments = oEvent.getParameter("arguments");
			sProductID = mRouteArguments.ProductId;
			var oODataModel = this.getView().getModel("odata");

			oODataModel.metadataLoaded().then(function () {
				var sKey = oODataModel.createKey("/Products", {id: sProductID});
				that.getView().bindObject({
					path: sKey,
					model: "odata"
				});
			});

			this.onFilterProductComments();
		},

        /**
         * Filter all product comments.
         */
		onFilterProductComments: function () {
			var oItemsBinding = this.byId("productCommentsContainer").getBinding("items");
            var oFilter = new Filter("ProductId", FilterOperator.EQ, sProductID);
            var oSorter = new Sorter("Posted", true);
            oItemsBinding.filter(oFilter).sort(oSorter);
		  },

        /**
         * "Press" event handler of the "Breadcrumbs link" which navigation to StoreDetails page.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
		onNavToBackStoreDetails: function (oEvent) {
            var router = this.getOwnerComponent().getRouter();
            var oCtx = oEvent.getSource().getBindingContext("odata");
			router.navTo("StoreDetails", {
				StoreId: oCtx.getProperty("StoreId") 
			});
		},

        /**
         * "Press" event handler of the "FeedInput" post new comment.
         */
        onPost: function() {
            var sMessage = this.byId("messageInput").getValue();
            var oODataModel = this.getView().getModel("odata");
            var oRating = this.byId("productReating");
            var oAuthor = this.byId("authorName");
            if(oAuthor.getValue() && oRating.getValue()) {
                var oNewComment = oODataModel.createEntry("/ProductComments", {
                    properties: {
                        ProductId: sProductID,
                        Message: sMessage,
                        Rating: oRating.getValue(),
                        Posted: new Date(),
                        Author: oAuthor.getValue()
                    }
                });
                oAuthor.setValueState("None");
                oAuthor.setValue("");
                oRating.setValue("");
                oODataModel.submitChanges();
                oODataModel.deleteCreatedEntry(oNewComment);
                
            } else if(!oAuthor.getValue()) {
                oAuthor.setValueState("Error");
                sMessage.setValue(sMessage);

            } else if(!oRating.getValue()) {
                oAuthor.setValueState("None");
                MessageToast.show("Indicate rating!")
                sMessage.setValue(sMessage);
            }
        },

        /**
         * set text  on "ObjectStatus" depending current product status.
         * 
         * @param {string} sStatus status value.
         */
        productStatusTextFormatter: function (sStatus) {
            var oResources = this.getView().getModel("i18n").getResourceBundle();
            switch (sStatus) {
                case "OK": return oResources.getText("StatusOk");
                case "STORAGE": return oResources.getText("StatusStorage");
                case "OUT_OF_STOCK": return oResources.getText("StatusOutOfStock");
            }
        }
        
	});
});
