import React, { useState, useRef } from 'react';
import MapView from './map/MapView';
import Meta from './editor/Meta';
import Editor from './editor/Editor';
import Convert from '../convert';
import * as MapStyles from '../constants/mapstyles';
import * as Defaults from '../constants/defaults';
import { owmBuild } from '../version';
import { ipcRenderer } from 'electron';
import html2canvas from 'html2canvas';

function OfflineApp() {
	const OPERATING_MODE = 'app';
	const PAGE_TITLE = 'Offline Wardley Map - ' + owmBuild;
	const [metaText, setMetaText] = useState('');
	const [mapText, setMapText] = useState('');
	const [mapTitle, setMapTitle] = useState('Untitled Map');
	const [mapComponents, setMapComponents] = useState([]);
	const [mapAnchors, setMapAnchors] = useState([]);
	const [mapLinks, setMapLinks] = useState([]);
	const [mapAnnotations, setMapAnnotations] = useState([]);
	const [mapMethods, setMapMethods] = useState([]);
	const [invalid, setInvalid] = useState(false);
	const [mapAnnotationsPresentation, setMapAnnotationsPresentation] = useState(
		[]
	);
	const [mapDimensions, setMapDimensions] = useState(Defaults.MapDimensions);
	const [mapFile, setMapFile] = useState('');
	const [mapEvolutionStates, setMapEvolutionStates] = useState(
		Defaults.EvolutionStages
	);
	const [mapStyle, setMapStyle] = useState('plain');
	const [mapYAxis, setMapYAxis] = useState({});
	const [mapStyleDefs, setMapStyleDefs] = useState(MapStyles.Plain);
	const mapRef = useRef(null);

	const getHeight = () => {
		var winHeight = window.innerHeight;
		return winHeight - 105;
	};
	const getWidth = function() {
		return document.getElementById('map').clientWidth - 50;
	};

	const mutateMapText = newText => {
		setMapText(newText);
	};

	const handleAppCommand = function(_, ev) {
		if (ev.action == 'save-as') {
			ipcRenderer.send('save-file', { d: mapText, new: true });
		}
		if (ev.action == 'save-file') {
			if (mapFile.length > 0) {
				ipcRenderer.send('save-file', {
					d: mapText,
					new: false,
					filePath: mapFile,
				});
			} else {
				ipcRenderer.send('save-file', { d: mapText, new: false });
			}
		}
		if (ev.action == 'open-file') {
			ipcRenderer.send('open-file');
		}
		if (ev.action == 'new-window') {
			ipcRenderer.send('new-window');
		}
		if (ev.action == 'new-file') {
			newMap();
		}
		if (ev.action == 'export') {
			downloadMap();
		}
	};

	const handleFileLoad = function(_, ev) {
		setMapText(ev.data);
		setMapFile(ev.filePath);
	};

	const handleFileChanged = function(_, ev) {
		console.log(ev.filePath);
		setMapFile(ev.filePath);
	};

	function newMap() {
		setMapText('');
		setMapFile('');
		setMetaText('');
	}

	function downloadMap() {
		html2canvas(mapRef.current).then(canvas => {
			const base64image = canvas.toDataURL('image/png');
			const link = document.createElement('a');
			link.download = mapTitle;
			link.href = base64image;
			link.click();
		});
	}

	React.useEffect(() => {
		try {
			setInvalid(false);
			var r = new Convert().parse(mapText);
			setMapTitle(r.title);
			setMapAnnotations(r.annotations);
			setMapAnchors(r.anchors);
			setMapComponents(r.elements);
			setMapLinks(r.links);
			setMapMethods(r.methods);
			setMapStyle(r.presentation.style);
			setMapYAxis(r.presentation.yAxis);
			setMapAnnotationsPresentation(r.presentation.annotations);
			setMapEvolutionStates({
				genesis: { l1: r.evolution[0].line1, l2: r.evolution[0].line2 },
				custom: { l1: r.evolution[1].line1, l2: r.evolution[1].line2 },
				product: { l1: r.evolution[2].line1, l2: r.evolution[2].line2 },
				commodity: { l1: r.evolution[3].line1, l2: r.evolution[3].line2 },
			});
		} catch (err) {
			setInvalid(true);
			console.log('Invalid markup, could not render.');
		}
	}, [mapText]);

	React.useEffect(() => {
		if (mapFile.length > 0) {
			let parts = mapFile.split('/');
			document.title =
				mapTitle + ' - ' + PAGE_TITLE + ' (' + parts[parts.length - 1] + ')';
		} else {
			document.title = mapTitle + ' - ' + PAGE_TITLE;
		}
	}, [mapFile, mapTitle]);

	React.useEffect(() => {
		switch (mapStyle) {
			case 'colour':
			case 'color':
				setMapStyleDefs(MapStyles.Colour);
				break;
			case 'wardley':
				setMapStyleDefs(MapStyles.Wardley);
				break;
			case 'handwritten':
				setMapStyleDefs(MapStyles.Handwritten);
				break;
			default:
				setMapStyleDefs(MapStyles.Plain);
		}
	}, [mapStyle]);

	function debounce(fn, ms) {
		let timer;
		return () => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				fn.apply(this, arguments);
			}, ms);
		};
	}

	React.useEffect(() => {
		ipcRenderer.on('appCommand', handleAppCommand);
		ipcRenderer.on('loaded-file', handleFileLoad);
		ipcRenderer.on('save-file-changed', handleFileChanged);

		const debouncedHandleResize = debounce(() => {
			setMapDimensions({ width: getWidth(), height: getHeight() });
		}, 1000);

		const initialLoad = () => {
			setMapDimensions({ width: getWidth(), height: getHeight() });
		};

		window.addEventListener('resize', debouncedHandleResize);
		window.addEventListener('load', initialLoad);

		return function cleanup() {
			ipcRenderer.removeListener('appCommand', handleAppCommand);
			ipcRenderer.removeListener('loaded-file', handleFileLoad);
			ipcRenderer.removeListener('save-file-changed', handleFileChanged);
			window.removeEventListener('resize', debouncedHandleResize);
			window.removeEventListener('load', initialLoad);
		};
	});

	return (
		<React.Fragment>
			<div className="container-fluid app">
				<div className="row">
					<div className="col editor">
						<Editor
							operatingMode={OPERATING_MODE}
							mapText={mapText}
							invalid={invalid}
							mutateMapText={mutateMapText}
							mapComponents={mapComponents}
							mapAnchors={mapAnchors}
							mapDimensions={mapDimensions}
						/>
						<div className="form-group">
							<Meta metaText={metaText} />
						</div>
					</div>

					<MapView
						mapTitle={mapTitle}
						mapComponents={mapComponents}
						mapAnchors={mapAnchors}
						mapLinks={mapLinks}
						mapAnnotations={mapAnnotations}
						mapAnnotationsPresentation={mapAnnotationsPresentation}
						mapMethods={mapMethods}
						mapStyleDefs={mapStyleDefs}
						mapYAxis={mapYAxis}
						mapDimensions={mapDimensions}
						mapEvolutionStates={mapEvolutionStates}
						mapRef={mapRef}
						mapText={mapText}
						mutateMapText={mutateMapText}
						setMetaText={setMetaText}
						metaText={metaText}
						evolutionOffsets={Defaults.EvoOffsets}
					/>
				</div>
			</div>
		</React.Fragment>
	);
}

export default OfflineApp;
