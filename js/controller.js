// myQueryCtrl.js

'use strict';

var app = angular.module('homePage', ['localStorage']);
var IS_LINK = /^[http(s)?:\/\/].+/;
var cleanup = function(obj) {
	//add entry to default category if category is empty
	if(!obj.cat || obj.cat.length === 0 ) obj.cat = 'default';
	//if url misses protocol add default http, to allow link recognition in browser
	if(!IS_LINK.test(obj.url)) obj.url = 'http://' + obj.url;
	return obj;
}

app.controller('mainCtrl', function($scope, $rootScope, $store) {
/* Bof: define some vars */
	$scope.isCollapsed = false;
	$scope.exportOpen = false;
	$scope.importOpen = false;
	$scope.confirmClear = false;
	var obj = {};
	obj.id = '';
	obj.cat = '';
	obj.url = '';
	obj.name = '';
/* ---- */

/* Bof: Show / Hide sidebar */
	
	$scope.toggle = function() {
		if(!$scope.exportOpen && !$scope.importOpen && !$scope.confirmClear) {
			$scope.isCollapsed = !$scope.isCollapsed;
			$rootScope.$broadcast('mainCtrl.isCollapsed', $scope.isCollapsed);
		}
	};
/* ---- */

/* Bof: Theming */
	$scope.themes = [
		{ name: 'Default', value: 'default' },
		{ name: 'Fabric', value: 'fabric' },
		{ name: 'Taxi', value: 'taxi' },
		{ name: 'Tones', value: 'tones' },
		{ name: 'Pastel Sky', value: 'pastel' },
		{ name: 'Clouds', value: 'clouds' }
	];

	$scope.selectedTheme = $store.get('selection') || $scope.themes[0].value;
	$scope.cssTheme = $scope.selectedTheme;

	$scope.$on('theme.update', function(evt, val) {
		$scope.cssTheme = val;
	});

	$scope.$watch('selectedTheme', function(newVal, oldVal) {
		$store.set('selection', $scope.selectedTheme);
		$rootScope.$broadcast('theme.update', newVal);
	});
/* ---- */

/* Bof: Layout */
	$scope.$on('column.update', function(evt, val) {
		$scope.column = val;
		$scope.ceckedColumn = val;
	});

	$scope.columnDefault = 'one';
	$scope.selectedColumns = $store.get('columns') || $scope.columnDefault;
	$scope.column = $scope.selectedColumns;

	$scope.$watch('column', function(newVal, oldVal) {
		$store.set('columns', $scope.column);
		$rootScope.$broadcast('column.update', newVal);
	});
/* ---- */

	$scope.themeUpdate = function() {
		$scope.selectedTheme = $store.get('selection') || $scope.themes[0].value;
		$scope.column = $store.get('columns') || $scope.columnDefault;
	};

/* Bof: read LocalStorage for main content */
	$scope.bookmarks = function(){
		$scope.items = [];

		for (var i = 0; i < localStorage.length; i++){
			var lsKey = localStorage.key(i);
			if(lsKey != "selection" && lsKey != "columns") {
				$scope.items.push($store.get(lsKey));				
			}
		}

	};

	$scope.bookmarks();
/* ---- */

/* Bof: EditMode */

/* Bof: read LocalStorage for sidebar (edit mode) */
	$scope.editBookmarks = function(){
		$scope.editItems = [];

		/* Bof: getting keys from LS */
		for (var i = 0; i < localStorage.length; i++){
			var lsKey = localStorage.key(i);
			if(lsKey != "selection" && lsKey != "columns") {
				$scope.editItems.push($store.get(lsKey));
			}
		}
		/* ---- */

		/* Bof: Group items by 'cat' */
		var logs = $scope.editItems;
		var sorted = [];
		logs.forEach(function(log){
			if (!sorted[log['cat']]) {
				sorted[log['cat']]= [];
			} 
			sorted[log['cat']].push(log);
		});

		$scope.cats=[];
		for(var cat in sorted) {
			$scope.cats.push({name:cat,items:sorted[cat]});
		}
		$scope.bookmarks();
		/* ----- */
	};

	$scope.editBookmarks();
/* ---- */

/* Bof: add a new bookmark */
	$scope.addNew = function(){
		//stop work, if dont have a url and name
		if (!$scope.newUrl || $scope.newUrl.length === 0 || !$scope.newName || $scope.newName.length === 0) return;
		
		var now = new Date();
		obj.id = now.getTime();
		obj.cat = $scope.newCat;
		obj.url = $scope.newUrl;
		obj.name = $scope.newName;
		$store.set(obj.id, cleanup(obj));

		$scope.clearForm();
		$scope.editBookmarks();
	};
/* ---- */

/* Bof: reset "add new" form */
	$scope.clearForm = function(){
		$scope.newCat = '';
		$scope.newUrl = '';
		$scope.newName = '';
		$scope.importJson = '';
		$scope.exportJson = '';
	};
/* ---- */

/* Bof: delete entry */
	$scope.delItem = function(item){
		$store.remove(item);
		$scope.editBookmarks();
		$scope.bookmarks();
	};
/* ---- */

/* Bof: save entry */
	$scope.saveItem = function(item){
		//stop work, if dont have a url and name
		if (!item.url || item.url.length === 0 || !item.name || item.name.length === 0) return;
		$store.set(item.id, cleanup(item));
		$scope.editBookmarks();
	};
/* ---- */

/* Bof: cancel edit entry */
	$scope.cancelEdit = function(item){
		$scope.editBookmarks();
	};
/* ---- */
	$scope.exportData = function(){
		var temp = JSON.stringify(localStorage);
		$scope.exportOpen = true;
		$rootScope.$broadcast('mainCtrl.exportOpen', $scope.exportOpen);
		$scope.exportJson = temp;
	};

	$scope.closeExport = function(){
		$scope.exportOpen = false;
		$rootScope.$broadcast('mainCtrl.exportOpen', $scope.exportOpen);
	};

	$scope.download = function (){
		var textToWrite = $scope.exportJson;
		var fileNameToSaveAs = "talo_bookmarks";
		var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
		var downloadLink = document.createElement("a");

		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";

		if (window.webkitURL != null)	{
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		} else {
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}

		downloadLink.click();

	};

	$scope.openImport = function(){
		$scope.importOpen = true;
		$rootScope.$broadcast('mainCtrl.importOpen', $scope.importOpen);
	};

	$scope.closeImport = function(){
		$scope.importOpen = false;
		$rootScope.$broadcast('mainCtrl.importOpen', $scope.importOpen);
	};

	$scope.restoreClean = function(){
		localStorage.clear();
		var string2json = $scope.importJson;
		try {
			var data = JSON.parse(string2json);
		} catch(e) {
			alert('not valid json string')
			return;
		}
		
		for (var key in data) {
			localStorage[key] = data[key];
		}
		$scope.themeUpdate();
		$scope.editBookmarks();
		$scope.clearForm();
		$scope.closeImport();
	};

	$scope.restoreAdd = function(){
		var string2json = $scope.importJson;
		try {
			var data = JSON.parse(string2json);
		} catch(e) {
			alert('not valid json string')
			return;
		}
		
		for (var key in data) {
			localStorage[key] = data[key];
		}
		$scope.editBookmarks();
		$scope.clearForm();
		$scope.closeImport();
		$scope.themeUpdate();
	};

	$scope.confirmClearAll = function(){
		$scope.confirmClear = true;
		$rootScope.$broadcast('mainCtrl.confirmClear', $scope.confirmClear);
	};

	$scope.closeConfirmClearAll = function(){
		$scope.confirmClear = false;
		$rootScope.$broadcast('mainCtrl.confirmClear', $scope.confirmClear);
	};

	$scope.clearAll = function(){
		var tempSelection = $store.get('selection');
		var tempColumns = $store.get('columns');
		
		localStorage.clear();
		
		// $store.set('selection', tempSelection);
		// $store.set('columns', tempColumns);

		$scope.editBookmarks();
		$scope.themeUpdate();
	};

/* Bof: check if first start. First start == localStorage is empty */
if(localStorage.length <= 2) {
	for (var key in DEFAULT_ENTRIES) {
		$store.set(key, DEFAULT_ENTRIES[key]);
	}
	$scope.editBookmarks();
	$scope.themeUpdate();
}
/* ---- */
});
