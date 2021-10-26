sap.ui.define([
    "dmitry/buravkin/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Sorter"
], function (BaseController, Filter, FilterOperator, MessageToast, MessageBox, JSONModel, Sorter) {
	"use strict";

    var SORT_NONE	    = "";
    var SORT_ASC	    = "ASC";
    var SORT_DESC	    = "DESC";
    var SORT_NONE_ICON  = "sap-icon://sort";
	return BaseController.extend("dmitry.buravkin.controller.StoreDetails", {
        /**
         * Controller`s "init" lifecycle method.
         */
		onInit: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("StoreDetails").attachPatternMatched(this.onPatternMatched, this);

            var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(this.getView(), true);
			this.getView().setModel(oMessageManager.getMessageModel(), "messages");
			window.model = oMessageManager.getMessageModel();

            var oAppViewModel = new JSONModel({
                sortType: SORT_NONE
            });
            this.oAppViewModel = oAppViewModel;
            this.getView().setModel(oAppViewModel, "appView");
		},

        /**
         * Controller`s "afterRendering" lifecycle method.
         * 
         */
		onAfterRendering: function () {
			var oODataModel = this.getView().getModel("odata");
			var oProductsTable = this.byId("productsTable");
			var oBinding = oProductsTable.getBinding("items");
			var oAppView = this.getView().getModel("appView");

			oBinding.attachDataReceived(function () {
                var oCtx = oProductsTable.getBindingContext("odata");
                var sStoresPath = oODataModel.createKey("/Stores", oCtx.getObject());
                var aStatuses = ["ALL", "OK", "STORAGE", "OUT_OF_STOCK"];
                 
                aStatuses.forEach(function (sStatus) {
                    var oParams = {
                        success: function (sCount) {
                        oAppView.setProperty(
                            "/" + sStatus.toLowerCase() + "ProductsCount",
                            sCount
                        );
                        },
                    };
                    
                    if (sStatus !== "ALL") {
                        oParams.filters = [
                        new Filter("Status", FilterOperator.EQ, sStatus),
                        ];
                    };
                    oODataModel.read(sStoresPath + "/rel_Products/$count", oParams);
                });
			});
		},

        /**
         * Provides information about current store.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
		onPatternMatched: function (oEvent) {
			var that = this;
			var mRouteArguments = oEvent.getParameter("arguments");
			var sStoreID = mRouteArguments.StoreId;
			var oODataModel = this.getView().getModel("odata");

			oODataModel.metadataLoaded().then(function () {
				var sKey = oODataModel.createKey("/Stores", {id: sStoreID}); 
				that.getView().bindObject({
					path: sKey,
					model: "odata"
				});
			});

		},

        /**
         * "Press" event handler of the "IconTabFilter" which searches suitable products.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onFilterSelect: function(oEvent) {
            var oProductTableBinding = this.byId("productsTable").getBinding("items");
			var	sKey = oEvent.getParameter("key");
	
            if (sKey === "OK") {
				oProductTableBinding.filter(this.getSelectFilter("OK"));
			} else if (sKey === "STORAGE") {
				oProductTableBinding.filter(this.getSelectFilter("STORAGE"));
			} else if (sKey === "OUT_OF_STOCK") {
				oProductTableBinding.filter(this.getSelectFilter("OUT_OF_STOCK"));
			} else {
                oProductTableBinding.filter(this.getSelectFilter(""));
            }
        },

         /**
         * Function which return object with products filter.
         * 
         * @param {string} sQuery query key.
         * 
         * @returns {Object}
         */
        getSelectFilter: function(sQuery) {
			return new Filter({
				filters: [
					new Filter("Status", FilterOperator.Contains, sQuery)
				],
				and: false
			})
		},

        /**
         * "Press" event handler of the "ColumnListItem" which navigation to ProductDetails page(this page contains information about select product).
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
		onOpenPersonProductDetails: function(oEvent) {
			var oCtx = oEvent.getSource().getBindingContext("odata");
			var oComponent = this.getOwnerComponent();

			oComponent.getRouter().navTo("ProductDetails", {
				ProductId: oCtx.getObject("id")
			});
		},

         /**
         * "Search" event handler of the "SearchField" which searches suitable products.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onProductSearch: function(oEvent) {
            var oStoresTableBinding = this.byId("productsTable").getBinding("items");
			var sQuery = oEvent.getParameter("query");
			oStoresTableBinding.filter(this.getSearchFilters(sQuery));
        },

        /**
         * Function which return object with products filter.
         * 
         * @param {string} sQuery query key.
         * 
         * @returns {Object}
         */
        getSearchFilters: function(sQuery) {
			return new Filter({
				filters: [
					new Filter("Name", FilterOperator.Contains, sQuery),
					new Filter("Specs", FilterOperator.Contains, sQuery),
                    new Filter("SupplierInfo", FilterOperator.Contains, sQuery),
                    new Filter("MadeIn", FilterOperator.Contains, sQuery),
					new Filter("ProductionCompanyName", FilterOperator.Contains, sQuery)
				],
				and: false
			})
		},

        /**
         * "Press" event handler of the "Button" which open dialog window for creating new product.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onOpenProductDialog: function(oEvent) {
			var oView = this.getView();
            var oODataModel = oView.getModel("odata");
            if (!this.oCreateProductDialog) {
                this.oCreateProductDialog = sap.ui.xmlfragment(oView.getId(), "dmitry.buravkin.view.fragments.ProductCreateDialog", this)
                oView.addDependent(this.oCreateProductDialog);
            }
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var oEntryCtx  = oODataModel.createEntry("/Products", {
                properties: {
                    StoreId: `${oCtx.getProperty("id")}`
                }
            });
            this.oCreateProductDialog.setBindingContext(oEntryCtx);
            this.oCreateProductDialog.setModel(oODataModel);
            this.oCreateProductDialog.open();
		},

        /**
         * "Press" event handler of the "Button" which open dialog window for creating new product.
         */
        onDialogProductCreatePress: function () {
            var aInputs = this.getView().getControlsByFieldGroupId("productCreateInputs").filter(c => c.isA("sap.m.Input"));
            var oResources = this.getView().getModel("i18n").getResourceBundle();
            if (!this.validationCheck(aInputs)){
                var oODataModel = this.getView().getModel("odata");
                oODataModel.submitChanges();
                this.oCreateProductDialog.close();
                var oCtx = this.oCreateProductDialog.getBindingContext();
                oODataModel.deleteCreatedEntry(oCtx);
                MessageToast.show(oResources.getText("ProductCreateDialogSuccessfully"));
            } else {
                MessageToast.show(oResources.getText("ProductCreateDialogError"));
                return;
            }
           
        },

        /**
         * "Press" event handler of the "Button" which close dialog window.
         */
        onDialogProductClosePress: function () {
            var oODataModel = this.getView().getModel("odata");
            var oCtx = this.oCreateProductDialog.getBindingContext();
            oODataModel.deleteCreatedEntry(oCtx);
            this.getView().getControlsByFieldGroupId("productCreateInputs")
                .filter(c => c.isA("sap.m.Input"))
                .forEach(oInput => oInput.setValueState("None"));
            this.oCreateProductDialog.close();
        },
        
        /**
         * "Press" event handler of the "Button" which delete selected product.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onDeleteProductPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var oODataModel = oCtx.getModel();
            var sKey = oODataModel.createKey("/Products", oCtx.getObject());
            var oResources = this.getView().getModel("i18n").getResourceBundle();
            this.confirmP(oResources.getText("ProductDeleteConfirm"))
                .then(function() {
                    oODataModel.remove(sKey, {
                        success: function () {
                            MessageToast.show(oResources.getText("ProductDeleteConfirmSuccessfully"));
                        },
                        error: function () {
                            MessageBox.error(oResources.getText("ProductDeleteConfirmError"));
                        }
                    });
                })
                .catch(function(){});
        },

        /**
         * "Press" event handler of the "Button" which open dialog window for editing product.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onOpenChangeDialog: function(oEvent) {
            var oView = this.getView();
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var oOdataModel = oCtx.getModel();
            if(!this.oEditProductDialog) {
                this.oEditProductDialog = sap.ui.xmlfragment(oView.getId(), "dmitry.buravkin.view.fragments.ProductEditDialog", this);
                oView.addDependent(this.oEditProductDialog);
            }
            this.oEditProductDialog.setBindingContext(oCtx);
            this.oEditProductDialog.setModel(oOdataModel);
            this.oEditProductDialog.open();
        },

        /**
         * "Press" event handler of the "Button" save changes.
         */
        onSaveChangePress: function() {
            var aInputs = this.getView().getControlsByFieldGroupId("productEditInputs").filter(c => c.isA("sap.m.Input") || c.isA("sap.m.DatePicker"));
            var oResources = this.getView().getModel("i18n").getResourceBundle();
            if (!this.validationCheck(aInputs)){
                var oODataModel = this.getView().getModel("odata");
                oODataModel.submitChanges();
                this.oEditProductDialog.close();
                MessageToast.show(oResources.getText("ProductEditDialogSuccessfully"));
            } else {
                MessageToast.show(oResources.getText("ProductEditDialogError"));
                return;
            }
        },

        /**
         * "Press" event handler of the "Button" which close dialog window.
         */
        onCancelChangePress: function() {
            var oODataModel = this.getView().getModel("odata");
            oODataModel.resetChanges();
            this.oEditProductDialog.close();   
        },

        /**
         * "Press" event handler of the "Button" which sorts the table by the selected column.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onSortButtonPress: function(oEvent) {
            var sSortName = oEvent.getSource().data("columnName");
            var sSortType = this.oAppViewModel.getProperty("/sortType");
            var oItemsBinding = this.byId("productsTable").getBinding("items");
            switch(sSortType) {
                case SORT_NONE: {
                    sSortType = SORT_ASC;
                    break;
                };
                case SORT_ASC: {
                    sSortType = SORT_DESC;
                    break;
                };
                case SORT_DESC: {
                    sSortType = SORT_NONE;
                    break;
                };
            };
            var sSortIcon = oEvent.getSource().getProperty("icon");
            this.oAppViewModel.setProperty("/sortType", sSortType);
            var sCurrentIconType = this.iconCorrespondedToSortType(sSortIcon.replace("sap-icon://", ""));

            if (sCurrentIconType !== sSortType) {
                this.oAppViewModel.setProperty("/sortType", SORT_ASC);
                var oSorter = new Sorter(sSortName, false);
            } else if (sSortType !== SORT_NONE) {
                var bSortDesc = sSortType === SORT_DESC;
                var oSorter = new Sorter(sSortName, bSortDesc);
            };

            oItemsBinding.sort(oSorter);
            this.resetNeighbourSortingState(sSortName);
        },

        /**
         * Formatter which select type of icon depending on the current sort type.
         * 
         * @param {string} sSortType sort type.
         */
        sortTypeFormatter: function(sSortType) {
            switch(sSortType) {
                case SORT_NONE: {
                    return "sort";
                };
                case SORT_ASC: {
                    return "sort-ascending";
                };
                case SORT_DESC: {
                    return "sort-descending";
                };
                default: {
                    return "sort";
                }
            };
        },

         /**
         * Function which determines the type of sorting after click on icon.
         * 
         * @param {string} sSortType sort icon.
         */
        iconCorrespondedToSortType: function(sSortIcon) {
            switch(sSortIcon) {
                case "sort": {
                    return "ASC";
                };
                case "sort-ascending": {
                    return "DESC";
                };
                case "sort-descending": {
                    return "";
                };
            };
        },

         /**
         * Formatter which select type of icon depending on the current sort type.
         * 
         * @param {string} sSortName current sort column name.
         */
        resetNeighbourSortingState: function (sSortName) {
            var aIcons = this.getView().getControlsByFieldGroupId("sortTableButton");
            aIcons.forEach(function(oIcon) {
                if(oIcon.data("columnName") !== sSortName) {
                    oIcon.setProperty("icon", SORT_NONE_ICON);
                }
            });
        },

        /**
         * "Press" event handler of the "Button" which delete current store.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onDeleteStore: function(oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("odata");
            var oODataModel = oCtx.getModel();
            var sKey = oODataModel.createKey("/Stores", oCtx.getObject());
            var that= this;
            var oResources = this.getView().getModel("i18n").getResourceBundle();
            this.confirmP(oResources.getText("StoreDeleteConfirm"))
                .then(function() {
                    oODataModel.remove(sKey, {
                        success: function () {
                            MessageToast.show(oResources.getText("StoreDeleteConfirmSuccessfully"));
                        },
                        error: function () {
                            MessageBox.error(oResources.getText("StoreDeleteConfirmError"));
                        }
                    });
                })
                .then(function() {
                    that.onNavToBackStoreList();
                })
                .catch(function(){});
        },

        /**
         * Open confirm dialog.
         * 
         * @param {string} sMessage interrogative question.
         */
         confirmP: function(sMessage) {
            return new Promise(function(resolve,reject) {
                MessageBox.confirm(sMessage, (oAction) => {
                    if(oAction === MessageBox.Action.OK) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        },
	});
});
