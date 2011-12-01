{ Model, Collection, Router, View } = Backbone

# DB connection configs
_Config = 
	dbpath: "http://localhost:3000/"
	dbname: "bb"

# Namespaces
window.BB = 
	Models: {}
	TemplateSrc: {}
	Templates: {}
	Collections: {}
	Views: {}
	Main: null

# define template sources
BB.TemplateSrc = 
	list: '
<a href="#contact/<%= _id %>"><%= name %></a>
	'
	detail: '
<form>
  <fieldset>
    <legend>Kontakt: <span class="name-out"><%= obj.name %></span></legend>
    
    <div class="clearfix">
      <label for="contact_gender">Geschlecht</label>
      <div class="input">
        <select id="contact_gender" name="gender">
          <option <% if( obj.gender === "m" ){ %>selected="selected" <% } %>>m</option>
          <option <% if( obj.gender === "w" ){ %>selected="selected" <% } %>>w</option>
        </select>
      </div>
    </div><!-- /clearfix -->

    <div class="clearfix">
      <label for="contact_name">Name</label>
      <div class="input">
        <input type="text" name="name" id="contact_name" value="<%= name %>">
      </div>
    </div><!-- /clearfix -->

    <div class="clearfix">
      <label for="contact_email">E-Mail</label>
      <div class="input">
        <input type="text" name="email" id="contact_email" value="<%= obj.email %>">
      </div>
    </div><!-- /clearfix -->
    
    <div class="actions">
      <input type="button" value="Speichern" class="btn primary act-save">&nbsp;<a class="btn" href="#">Cancel</a><% if( obj._id ){ %>&nbsp;<a class="btn error" href="#delete/contact/<%= _id %>">löschen</a><% } %>
    </div>
  </fieldset>
</form>
	'

# precompile templates
for name, src of BB.TemplateSrc
	BB.Templates[ name ] = _.template( src )



# ====== BEGINN Backbode ======

# Model definitions
class BB.Models.Contact extends Model
	# define the id attr to the mongo default
	idAttribute: "_id"

	# redefine the url REST-endpoint for a single model
	url: =>
		"#{ _Config.dbpath }#{ _Config.dbname }/addressbook/#{ @id or "" }"

# Collections definitions
class BB.Collections.Addressbook extends Collection
	# define the corresonding model constructor
	model: BB.Models.Contact

	# redefine the url REST-endpoint for a single model
	url: "#{ _Config.dbpath }#{ _Config.dbname }/addressbook/"

# Router
class BB.Main extends Router

	# define the routes
	routes: 
		"": "none"
		"contact/:id": "contactEdit"
		"create/contact": "contactCreate"
		"delete/contact/:id": "contactDelete"
	
	initialize: =>
		
		# get instances of collections
		@_collections = 
			addressbook: new BB.Collections.Addressbook()
		
		# start 
		@_bootstrap()

		return
	
	_bootstrap: =>
		# run initial view
		@start()

		# get the data
		@_collections.addressbook.fetch
			success: =>
				@trigger( "ready" )
				
		return
	
	contactCreate: =>
		# on route "create/contact" create an empty model and display the model
		model = new BB.Models.Contact()
		@contactDisplay( model )
		return

	contactEdit: ( id )=>
		# on route "contact/:id" get the model and display it
		model = @_collections.addressbook.get( id )
		@contactDisplay( model ) if model
		return
	
	contactDelete: ( id )=>
		# on route "delete/contact/:id" get the model and delete it
		model = @_collections.addressbook.get( id )	
		if model
			model.destroy
				success: =>
					@navigate( "", false )
		return

	contactDisplay: ( model )=>
		# generate a new View for the given model and put it to the target element
		elTarget = $( "#modelTarget" )
		
		view = new BB.Views.Contact.Form( router: @, model: model )
		elTarget.html( view.render().el )
		return
	
	none: =>
		# set model as empty
		elTarget = $( "#modelTarget" ).empty()
		return

	start: =>
		# generate the list view and put it to its target
		elTarget = $( "#collectionTarget" )

		view = new BB.Views.Addressbook( router: @, collections: @_collections )

		elTarget.html( view.el )
		return


# Views 
class BB.Views.Addressbook extends View
	tagName: "ul"

	initialize: ( options )=>
		# define local vars
		@router = options.router
		@collections = options.collections

		# bind backbone events
		@collections.addressbook.bind "reset", @render
		@collections.addressbook.bind "add", @addOne

		@
	
	addOne: ( contact )=>
		# add a single contact to the list
		view = new BB.Views.Contact.List( router: @router, model: contact )
		@$( @el ).append( view.render().el )
		return

	render: =>
		# generate the view of each model in the collection
		views = []
		@collections.addressbook.each ( contactModel )=>

			# generate view
			view = new BB.Views.Contact.List( router: @app, model: contactModel )

			# render view and add the element to the results array
			views.push( view.render().el )
			return
		
		@$( @el ).html( views )
		@

BB.Views.Contact = {}

class BB.Views.Contact.List extends View
	tagName: "li"
	template: BB.Templates.list

	initialize: ( options )=>
		# define local vars
		@router = options.router

		# listen to the models events
		@model.bind "change", @render
		@model.bind "destroy", @remove

		@
	
	remove: =>
		# remove the list element on a model destroy
		@$( @el ).remove()
		return

	render: =>
		# render the list element
		@$( @el ).html( @template( @model.toJSON() ) )
		@

class BB.Views.Contact.Form extends View
	tagName: "div"
	template: BB.Templates.detail

	events:
		"click .act-save": "save"
		"keyup #contact_name": "keyupName"
	
	initialize: ( options )=>
		# define local vars
		@router = options.router

		# listen to the models events
		@model.bind "destroy", @remove
		@model.bind "change", @render

		@

	remove: =>
		# remove the list element on a model destroy
		@$( @el ).remove()
		return

	render: =>
		# render the form
		@$( @el ).html( @template( @model.toJSON() ) )
		@
	
	save: =>
		# get the fields
		fields = @$( "form" ).serializeArray()

		# convert form values to an object
		data = {}
		for field in fields
			data[ field.name ] = field.value
		
		# check if the model is new
		isNew = true
		if not @model.isNew()
			isNew = false
			data._id = @model.id
			
		@model.save data,
			success:  ( contact )=>
				# on a successfull save add the model to its collection
				if isNew
					@router._collections.addressbook.add( @model )
					@router.navigate( "contact/#{ @model.id }", false )
	
	keyupName: ( event )=>
		# sugar: display the name in header while typing
		sName = $( event.currentTarget ).val()
		@$( ".name-out" ).html( sName )
		return

$(document).ready ->
	# generate the basic App
	window.BB._app = new BB.Main()

	# on ready start the router
	window.BB._app.bind "ready", ->
		Backbone.history.start()
	return