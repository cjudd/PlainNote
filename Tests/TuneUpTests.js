// Examples of Tuneup (https://github.com/alexvollmer/tuneup_js) Automation testing

#import "tuneup/tuneup.js"

test("Open Help Test", function(target, app) {
	 
	 app.toolbar().buttons()["Help"].tap();
	 
	 // without the delay the element was not on the screen and could not be tapped.		
	 target.delay(1);
	 target.captureScreenWithName("help_screen");
	 
	 // No good way to get to the URL or contents of a WebView
	 webView = app.mainWindow().scrollViews()[0].webViews()[0];
  
	 assertEquals("Create", webView.links()[0].name(), "HTML must be displayed");
	 
	 app.mainWindow().navigationBar().leftButton().tap();
});

test("Add Note Test", function(target, app) {

	 // without the delay the element was not on the screen and could not be tapped.
	target.delay(2); 
	app.navigationBar().buttons()["Add"].tap();
	 
	// without the delay the element was not on the screen and could not be tapped.
	target.delay(1);
	app.mainWindow().scrollViews()[0].textViews()["note"].setValue("CodeMash is cool!!!");
	 
	app.navigationBar().buttons()["Save"].tap();
	 
	// without the delay the element was not on the screen and could not be tapped.
	target.delay(1);
	 
	cell = app.mainWindow().tableViews()[0].cells().firstWithPredicate("name beginswith 'CodeMash'")
	
	assertTrue(cell.isValid(), "Note must display in list of notes.");	 
});
