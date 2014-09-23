import Rev1Serializer from "../serializers/rev1";
import UserMarketplace from "./user-marketplace";
import SearchModelArray from "./core/search-model-array";

var getResultsLoader = function(loaderClassName, attributes) {
	return BalancedApp.__container__.lookupFactory("results-loader:" + loaderClassName).create(attributes);
};

var generateResultsLoader = function(loaderClassName, uriFieldName) {
	return function(attributes) {
		attributes = _.extend({
			path: this.get(uriFieldName)
		}, attributes);
		return getResultsLoader(loaderClassName, attributes);
	};
};

var Marketplace = UserMarketplace.extend({
	uri: '/marketplaces',

	getInvoicesLoader: generateResultsLoader("invoices", "invoices_uri"),
	getCustomersLoader: generateResultsLoader("customers", "customers_uri"),
	getDisputesLoader: generateResultsLoader("disputes", "disputes_uri"),
	getTransactionsLoader: generateResultsLoader("transactions", "transactions_uri"),
	getOrdersLoader: generateResultsLoader("orders", "orders_uri"),
	getFundingInstrumentsLoader: function(attributes) {
		attributes = _.extend({
			marketplace: this
		}, attributes);
		return getResultsLoader("funding-instruments", attributes);
	},
	getLogsLoader: function(attributes) {
		attributes = _.extend({}, attributes);
		return getResultsLoader("logs", attributes);
	},
	getSearchLoader: function(attributes) {
		attributes = _.extend({
			marketplace: this,
		}, attributes);
		return getResultsLoader("marketplace-search", attributes);
	},

	credits: Balanced.Model.hasMany('credits', 'credit'),
	debits: Balanced.Model.hasMany('debits', 'debit'),
	// disputes: Balanced.Model.hasMany('disputes', 'dispute'),
	refunds: Balanced.Model.hasMany('refunds', 'refund'),
	holds: Balanced.Model.hasMany('holds', 'hold'),
	transactions: Balanced.Model.hasMany('transactions', 'transaction'),
	callbacks: Balanced.Model.hasMany('callbacks', 'callback'),

	funding_instruments: Balanced.Model.hasMany('funding_instruments', 'funding-instrument'),
	bank_accounts: Balanced.Model.hasMany('bank_accounts', 'bank-account'),
	cards: Balanced.Model.hasMany('cards', 'card'),

	owner_customer: Balanced.Model.belongsTo('owner_customer', 'customer'),

	customers: Balanced.Model.hasMany('customers', 'customer'),

	// TODO - take this out once marketplace has a link to invoices list
	users_uri: function() {
		return '/marketplaces/%@/users'.fmt(this.get('id'));
	}.property('id'),

	invoices_uri: '/invoices',
	disputes_uri: '/disputes',

	populateWithTestTransactions: function() {
		//  pre-populate marketplace with transactions
		var id = this.get('id');
		Balanced.NET.ajax({
			url: ENV.BALANCED.AUTH + '/marketplaces/%@/spam'.fmt(id),
			type: 'PUT'
		});
	},

	search: function(query, resultsType, params) {
		var baseUri = this.get("uri") + "/search";
		var searchParams = _.extend({
			sortField: "created_at",
			sortOrder: "desc",
			limit: 10,
			query: query
		}, params);

		var resultsUri = Balanced.Utils.applyUriFilters(baseUri, searchParams);
		return SearchModelArray.newArrayLoadedFromUri(resultsUri, resultsType);
	},

	has_debitable_bank_account: Ember.computed.readOnly('owner_customer.has_debitable_bank_account'),
	has_bank_account: Ember.computed.readOnly('owner_customer.has_bank_account')
});

Marketplace.reopenClass({
	findByApiKeySecret: function(secret) {
		return this.find("/marketplaces", {
			secret: secret
		});
	},
	findById: function(id) {
		var uri = this.constructUri(id);
		return this.find(uri);
	},
	serializer: Rev1Serializer.create(),
}, {
	COMPANY_TYPES: [{
		value: "llc",
		label: "LLC"
	}, {
		value: "s-corp",
		label: "S-Corp"
	}, {
		value: "c-corp",
		label: "C-Corp"
	}, {
		value: "partnership",
		label: "Partnership"
	}, {
		value: "sole-proprietorship",
		label: "Sole Proprietorship"
	}]
});

export default Marketplace;
