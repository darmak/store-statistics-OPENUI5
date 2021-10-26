sap.ui.define([
	"dmitry/buravkin/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageToast) {
	"use strict";

	return BaseController.extend("dmitry.buravkin.controller.StoresOverview", {
        /**
         * Controller`s "init" lifecycle method.
         */
        onInit: function() {
            var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(this.getView(), true);
			this.getView().setModel(oMessageManager.getMessageModel(), "messages");
			window.model = oMessageManager.getMessageModel();
        },

        /**
         * "Press" event handler of the "ColumnListItem" which navigation to StoreDetails page(this page contains information about select store).
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
		onOpenPersonStoreDetails: function(oEvent) {
			var oCtx = oEvent.getSource().getBindingContext("odata");
			var oComponent = this.getOwnerComponent();
			oComponent.getRouter().navTo("StoreDetails", {
				StoreId: oCtx.getObject("id")
			});
		},

        /**
         * "Search" event handler of the "SearchField" which searches suitable stores.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
		onStoreSearch: function(oEvent) {
			var oStoresTableBinding = this.byId("StoresTable").getBinding("items");
			var sQuery = oEvent.getParameter("query");
			oStoresTableBinding.filter(this.getSearchFilters(sQuery));
		},

        /**
         * Function which return object with store filter.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         * 
         * @returns {Object}
         */
		getSearchFilters: function(sQuery) {
			return new Filter({
				filters: [
					new Filter("Name", FilterOperator.Contains, sQuery),
					new Filter("Address", FilterOperator.Contains, sQuery)
				]
			});
		},

         /**
         * "Press" event handler of the "Button" which open dialog window for creating new store.
         * 
         * @returns {Object}
         */
		onOpenStoreDialog: function() {
			var oView = this.getView();
            var oODataModel = oView.getModel("odata");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "dmitry.buravkin.view.fragments.StoreCreateDialog", this)
                oView.addDependent(this.oDialog);
            }

            var oEntryCtx  = oODataModel.createEntry("/Stores", {
                properties: {
                    Name: "",
                    Email: "",
                    PhoneNumber: "",
                    Address: "",
                    Established: new Date(),
                    FloorArea: ""
                }
            });
            this.oDialog.setBindingContext(oEntryCtx);
            this.oDialog.setModel(oODataModel);
            this.oDialog.open();
		},

        /**
         * "Press" event handler of the "Button" which creates new store and close dialog window.
         */
        onDialogCreatePress: function () {
            var aInputs = this.getView().getControlsByFieldGroupId("storeCreateInputs").filter(c => c.isA("sap.m.Input"));
            var oResources = this.getView().getModel("i18n").getResourceBundle();
            if (!this.validationCheck(aInputs)){
                var oODataModel = this.getView().getModel("odata");
                oODataModel.submitChanges();
                this.oDialog.close(); 
                var oCtx = this.oDialog.getBindingContext();
                oODataModel.deleteCreatedEntry(oCtx);
                MessageToast.show(oResources.getText("StoreCreateDialogSuccessfully"));
            } else {
                MessageToast.show(oResources.getText("StoreCreateDialogError"));
                return;
            }
        },

        /**
         * "Press" event handler of the "Button" which close dialog window and clear inputs.
         */
        onDialogCancelPress: function () {
            var oODataModel = this.getView().getModel("odata");
            var oCtx = this.oDialog.getBindingContext();
            oODataModel.deleteCreatedEntry(oCtx);
            this.getView().getControlsByFieldGroupId("storeCreateInputs")
                .filter(c => c.isA("sap.m.Input"))
                .forEach(oInput => oInput.setValueState("None"));
            this.oDialog.close();
        }

	});
});
