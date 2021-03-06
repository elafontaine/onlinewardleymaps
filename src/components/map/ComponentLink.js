import React from 'react';
import MapPositionCalculator from '../../MapPositionCalculator';
import RelativeMovable from './RelativeMovable';
import MetaPositioner from '../../MetaPositioner';
var createReactClass = require('create-react-class');

function ComponentLink(props) {
	const mapCalc = new MapPositionCalculator();
	const x1 = () =>
		mapCalc.maturityToX(props.startElement.maturity, props.mapDimensions.width);
	const x2 = () =>
		mapCalc.maturityToX(props.endElement.maturity, props.mapDimensions.width);
	const y1 = () =>
		mapCalc.visibilityToY(
			props.startElement.visibility,
			props.mapDimensions.height
		);
	const y2 = () =>
		mapCalc.visibilityToY(
			props.endElement.visibility,
			props.mapDimensions.height
		);

	function defineStoke() {
		return props.startElement.evolved || props.endElement.evolved
			? props.mapStyleDefs.link.evolvedStroke
			: props.mapStyleDefs.link.stroke;
	}

	function defineStokeWidth() {
		return props.startElement.evolved || props.endElement.evolvedS
			? props.mapStyleDefs.link.evolvedStrokeWidth
			: props.mapStyleDefs.link.strokeWidth;
	}

	const isFlow = () => {
		return (
			props.link.flow &&
			(props.link.future == props.link.past || // both
				(props.link.past == true &&
					props.endElement.evolving == false &&
					props.startElement.evolving == true) ||
				(props.link.past == true &&
					props.endElement.evolving == true &&
					props.startElement.evolving == false) ||
				(props.link.future == true && props.startElement.eolving == true) ||
				(props.link.future == true && props.startElement.evolved == true) ||
				(props.link.future == true && props.endElement.evolved == true))
		);
	};

	return (
		<g>
			<line
				x1={x1()}
				y1={y1()}
				x2={x2()}
				y2={y2()}
				stroke={defineStoke()}
				strokeWidth={defineStokeWidth()}
			/>
			{isFlow() ? (
				<FlowLink
					mapStyleDefs={props.mapStyleDefs}
					endElement={props.endElement}
					startElement={props.startElement}
					link={props.link}
					metaText={props.metaText}
					setMetaText={props.setMetaText}
					x1={x1()}
					x2={x2()}
					y1={y1()}
					y2={y2()}
				/>
			) : null}
		</g>
	);
}

var FlowLink = createReactClass({
	render: function() {
		const metaPosition = new MetaPositioner();
		const flowLabelElementId =
			'flow_text_' +
			this.props.startElement.id +
			'_' +
			this.props.endElement.id;
		const getMetaPosition = () => {
			const defaultOffset = {
				x: 0,
				y: -30,
			};
			return metaPosition.for(
				flowLabelElementId,
				this.props.metaText,
				defaultOffset
			);
		};
		const flowLabelEndDrag = moved => {
			this.props.setMetaText(
				metaPosition.update(flowLabelElementId, this.props.metaText, moved)
			);
		};
		const flowLabelPosition = getMetaPosition();

		return (
			<>
				<g
					id={'flow_' + this.props.endElement.name}
					transform={'translate(' + this.props.x2 + ',' + this.props.y2 + ')'}
				>
					{this.props.link.flowValue == undefined ? null : (
						<RelativeMovable
							id={flowLabelElementId}
							fixedX={false}
							fixedY={false}
							onMove={flowLabelEndDrag}
							y={flowLabelPosition.y}
							x={flowLabelPosition.x}
						>
							<text
								className="draggable label"
								id={
									'flow_text_' +
									this.props.startElement.id +
									'_' +
									this.props.endElement.id
								}
								x="0"
								y="0"
								textAnchor="start"
								fill="#03a9f4"
							>
								{this.props.link.flowValue}
							</text>
						</RelativeMovable>
					)}
				</g>
				<line
					x1={this.props.x1}
					y1={this.props.y1}
					x2={this.props.x2}
					y2={this.props.y2}
					strokeWidth={this.props.mapStyleDefs.link.flowStrokeWidth}
					stroke={this.props.mapStyleDefs.link.flow}
				/>
			</>
		);
	},
});

export default ComponentLink;
