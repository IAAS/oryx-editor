package de.hpi.bpmn.serialization.erdf.templates;

import de.hpi.bpmn.DiagramObject;
import de.hpi.bpmn.IntermediatePlainEvent;
import de.hpi.bpmn.serialization.erdf.ERDFSerializationContext;

public class IntermediatePlainEventTemplate extends NonConnectorTemplate {

	private static BPMN2ERDFTemplate instance;

	public static BPMN2ERDFTemplate getInstance() {
		if (instance == null) {
			instance = new IntermediatePlainEventTemplate();
		}
		return instance;
	}	

	public StringBuilder getCompletedTemplate(DiagramObject diagramObject,
			ERDFSerializationContext transformationContext) {

		IntermediatePlainEvent e = (IntermediatePlainEvent) diagramObject;
		
		StringBuilder s = getResourceStartPattern(transformationContext.getResourceIDForDiagramObject(e));
		appendOryxField(s,"type",STENCIL_URI + "#IntermediatePlainEvent");
		appendOryxField(s,"eventtype","Intermediate");
		appendStandardFields(s);
		appendOryxField(s,"trigger","Plain");
		appendResourceEndPattern(s, e, transformationContext);
		
		return s;
	}

}