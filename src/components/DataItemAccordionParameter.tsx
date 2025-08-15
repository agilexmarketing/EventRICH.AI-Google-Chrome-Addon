import { SygnalDataEventCategory } from "../types";
import DataItemAccordionParameterItem from "./DataItemAccordionParameterItem";

export default function DataItemAccordionParameter({
	parameter,
}: { parameter: SygnalDataEventCategory }) {
	return (
		<div className="flex flex-col gap-3">
			<div className="uppercase text-sm font-bold text-lightBodyColor">
				{parameter.name}
			</div>
			<div className="flex flex-col gap-4">
				{parameter.items.map((parameterItem, i) => (
					<DataItemAccordionParameterItem
						key={`${parameterItem.name}-${i}`}
						parameterItem={parameterItem}
						shouldShowContent={
							parameter.name !== "personal info" &&
							parameterItem.value.length < 25
						}
					/>
				))}
			</div>
		</div>
	);
}
