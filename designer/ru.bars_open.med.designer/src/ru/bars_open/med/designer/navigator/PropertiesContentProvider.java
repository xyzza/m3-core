package ru.bars_open.med.designer.navigator;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.eclipse.core.resources.IFile;
import org.eclipse.core.resources.IResource;
import org.eclipse.core.resources.IResourceChangeEvent;
import org.eclipse.core.resources.IResourceChangeListener;
import org.eclipse.core.resources.IResourceDelta;
import org.eclipse.core.resources.IResourceDeltaVisitor;
import org.eclipse.core.resources.ResourcesPlugin;
import org.eclipse.core.runtime.CoreException;
import org.eclipse.core.runtime.IProgressMonitor;
import org.eclipse.core.runtime.IStatus;
import org.eclipse.core.runtime.Status;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.viewers.ITreeContentProvider;
import org.eclipse.jface.viewers.StructuredViewer;
import org.eclipse.jface.viewers.Viewer;
import org.eclipse.ui.progress.UIJob;
import org.python.pydev.core.IGrammarVersionProvider;
import org.python.pydev.core.Tuple;

import org.python.pydev.parser.jython.ast.ClassDef;
import org.python.pydev.parser.jython.ast.Module;
import org.python.pydev.parser.jython.ast.NameTok;

import org.python.pydev.parser.PyParser;
import org.python.pydev.parser.jython.SimpleNode;

/**
 * Provides the properties contained in a *.properties file as children of that
 * file in a Common Navigator.  
 * @since 3.2 
 */
public class PropertiesContentProvider implements ITreeContentProvider,
		IResourceChangeListener, IResourceDeltaVisitor {
  
	private static final Object[] NO_CHILDREN = new Object[0];

	private static final Object PROPERTIES_EXT = "models.py"; //$NON-NLS-1$

	private final Map/*<IFile, PropertiesTreeData[]>*/ cachedModelMap = new HashMap();

	private StructuredViewer viewer;
	
	/**
	 * Create the PropertiesContentProvider instance.
	 * 
	 * Adds the content provider as a resource change listener to track changes on disk.
	 *
	 */
	public PropertiesContentProvider() {
		ResourcesPlugin.getWorkspace().addResourceChangeListener(this, IResourceChangeEvent.POST_CHANGE);
	}

	/**
	 * Return the model elements for a *.properties IFile or
	 * NO_CHILDREN for otherwise.
	 */
	public Object[] getChildren(Object parentElement) {  
		Object[] children = null;
		if (parentElement instanceof PropertiesTreeData) { 
			children = NO_CHILDREN;
		} else if(parentElement instanceof IFile) {
			/* possible model file */
			IFile modelFile = (IFile) parentElement;
			if(PROPERTIES_EXT.equals(modelFile.getName())) {				
				children = (PropertiesTreeData[]) cachedModelMap.get(modelFile);
				if(children == null && updateModel(modelFile) != null) {
					children = (PropertiesTreeData[]) cachedModelMap.get(modelFile);
				}
			}
		}   
		return children != null ? children : NO_CHILDREN;
	}  

	/**
	 * Конвертирует InputStream в String
	 * @param is InputStream
	 * @return String
	 * @throws Exception
	 */
	public static String convertStreamToString(InputStream is) throws Exception {
	    BufferedReader reader = new BufferedReader(new InputStreamReader(is));
	    StringBuilder sb = new StringBuilder();
	    String line = null;
	    while ((line = reader.readLine()) != null) {
	      sb.append(line + "\n");  //$NON-NLS-1$
	    }
	    is.close();
	    return sb.toString();
	  }
	
	/**
	 * Load the model from the given file, if possible.  
	 * @param modelFile The IFile which contains the persisted model 
	 */ 
	private synchronized Properties updateModel(IFile modelFile) { 
		
		if(PROPERTIES_EXT.equals(modelFile.getName()) ) {
			Properties model = new Properties();
			if (modelFile.exists()) {
				try {
					model.load(modelFile.getContents()); 
					
					String str = null;
					Document doc = null;
					try {
						str = convertStreamToString(modelFile.getContents() );
						doc = new Document(str);
					} catch (Exception e) {
						e.printStackTrace();
					}
					
					Tuple<SimpleNode, Throwable> objects = PyParser.reparseDocument(
							new PyParser.ParserInfo(doc, false, IGrammarVersionProvider.GRAMMAR_PYTHON_VERSION_2_6)); 
					
	                Module m = (Module) objects.o1;
	               
	                List classList = new ArrayList();
					for (int i = 0; i< m.body.length; i++) {
						if (m.body[i] instanceof ClassDef) {
							ClassDef className = (ClassDef) m.body[i];
							NameTok classNameStrToken = (NameTok) className.name;
							
							classList.add(new PropertiesTreeData(classNameStrToken.id,  null, modelFile));
							
						}
					}
					
	                PropertiesTreeData[] propertiesTreeData = (PropertiesTreeData[])
						classList.toArray(new PropertiesTreeData[classList.size()]);
				
	                cachedModelMap.put(modelFile, propertiesTreeData);
					
					return model; 
				} catch (IOException e) {
				} catch (CoreException e) {
				}
			} else {
				cachedModelMap.remove(modelFile);
			}
		}
		return null; 
	}

	public Object getParent(Object element) {
		if (element instanceof PropertiesTreeData) {
			PropertiesTreeData data = (PropertiesTreeData) element;
			return data.getFile();
		} 
		return null;
	}

	public boolean hasChildren(Object element) {		
		if (element instanceof PropertiesTreeData) {
			return false;		
		} else if(element instanceof IFile) {
			return PROPERTIES_EXT.equals(((IFile) element).getName());
		}
		return false;
	}

	public Object[] getElements(Object inputElement) {
		return getChildren(inputElement);
	}

	public void dispose() {
		cachedModelMap.clear();
		ResourcesPlugin.getWorkspace().removeResourceChangeListener(this); 
	}

	public void inputChanged(Viewer aViewer, Object oldInput, Object newInput) {
		if (oldInput != null && !oldInput.equals(newInput))
			cachedModelMap.clear();
		viewer = (StructuredViewer) aViewer;
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.eclipse.core.resources.IResourceChangeListener#resourceChanged(org.eclipse.core.resources.IResourceChangeEvent)
	 */
	public void resourceChanged(IResourceChangeEvent event) {

		IResourceDelta delta = event.getDelta();
		try {
			delta.accept(this);
		} catch (CoreException e) { 
			e.printStackTrace();
		} 
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see org.eclipse.core.resources.IResourceDeltaVisitor#visit(org.eclipse.core.resources.IResourceDelta)
	 */
	public boolean visit(IResourceDelta delta) {

		IResource source = delta.getResource();
		switch (source.getType()) {
		case IResource.ROOT:
		case IResource.PROJECT:
		case IResource.FOLDER:
			return true;
		case IResource.FILE:
			final IFile file = (IFile) source;
			if (PROPERTIES_EXT.equals(file.getName())) {
				updateModel(file);
				new UIJob("Update Properties Model in CommonViewer") {  //$NON-NLS-1$
					public IStatus runInUIThread(IProgressMonitor monitor) {
						if (viewer != null && !viewer.getControl().isDisposed())
							viewer.refresh(file);
						return Status.OK_STATUS;						
					}
				}.schedule();
			}
			return false;
		}
		return false;
	} 
}
