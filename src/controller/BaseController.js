sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("dmitry.buravkin.controller.BaseController", {
        /**
         *"Press" event handler of the "Breadcrumbs link" which navigation to StoresOverview page.
         */
        onNavToBackStoreList: function () {
            var router = sap.ui.core.UIComponent.getRouterFor(this);
            router.navTo("StoresOverview");
		},

         /**
         * Function which validates input for correctly entered data.
         * 
         * @param {Object} oInput input for validation.
         * 
         * @returns {Boolean} false if input is correct.
         */
        validateInput: function(oInput) {
            var sValueState="None";
            var bValidationError = false;
            var oBinding = oInput.getBinding("value");

            try {
                oBinding.getType().validateValue(oInput.getValue());
            } catch (oException) {
                sValueState = "Error";
                bValidationError = true;
            }
            oInput.setValueState(sValueState);
            return bValidationError;
        },

        /**
         * Function which calls validation function for each input in array.
         * 
         * @param {Object[]} Inputs inputs for validation.
         * 
         * @returns {Boolean} false if input is correct.
         */
        validationCheck: function(Inputs) {
            if(!Array.isArray(Inputs)) {
                Inputs = [Inputs];
            }
            var bValidationError = false;
            Inputs.forEach(function(oInput) {
                bValidationError = this.validateInput(oInput) || bValidationError;
            }, this);
            return bValidationError;
        },

        /**
         * Function which check entered data in input after change.
         * 
         * @param {sap.ui.base.Event} oEvent event object.
         */
        onChange: function(oEvent) {
            var oInput = oEvent.getSource();
			this.validateInput(oInput);
        }
	});
});
