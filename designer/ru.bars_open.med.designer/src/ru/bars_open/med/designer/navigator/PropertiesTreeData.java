package ru.bars_open.med.designer.navigator;

import org.eclipse.core.resources.IFile;

/**
 * Provides a django models property 
 * 
 * @since 3.2
 */
public class PropertiesTreeData { 

	private IFile container; 
	private String name;  
	private String value;

	/**
	 * Create a property with the given name and value contained by the given file. 
	 *  
	 * @param aName The name of the property.
	 * @param aValue The value of the property.
	 * @param aFile The file that defines this property.
	 */
	public PropertiesTreeData(String aName, String aValue, IFile aFile) { 
		name = aName;
		value = aValue;
		container = aFile; 
	} 
 
	/**
	 * The name of this property.
	 * @return The name of this property.
	 */
	public String getName() {
		return name;
	}

	/**
	 * Return the value of the property in the file.  
	 * @return The value of the property in the file.
	 */
	public String getValue() {
		return value;
	}

	/**
	 * The IFile that defines this property.  
	 * @return The IFile that defines this property.
	 */
	public IFile getFile() { 
		return container;
	}

	public int hashCode() {
		return name.hashCode();
	}

	public boolean equals(Object obj) {
		return obj instanceof PropertiesTreeData
				&& ((PropertiesTreeData) obj).getName().equals(name);
	} 

	public String toString() {
		StringBuffer toString = 
				new StringBuffer(getName()).append(":").append(getValue()); //$NON-NLS-1$
		return toString.toString();
	}


}
