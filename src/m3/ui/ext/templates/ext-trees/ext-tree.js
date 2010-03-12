function(){
	var tree = new Ext.ux.tree.TreeGrid({
	    useArrows: true,
	    autoScroll: true,
	    animate: true,
	    enableDD: true,
	    containerScroll: true,
	    border: false,
		split: true,
		title: '{{ component.title }}',
		
		columns:[{{ component.render_columns|safe }}],
		loader: {{ component.render_tree_loader|safe }},	
		root: new Ext.tree.AsyncTreeNode({
			children: [ {{ component.render_nodes|safe }} ]
        })
        
	});
	
	{# Здесь может быть Ваша реклама! #}
	
	return tree;
}()

