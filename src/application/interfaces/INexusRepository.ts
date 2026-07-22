import { NexusGraphData } from "@/domain/entities/NexusGraph";

export interface INexusRepository {
  getGraphData(): Promise<NexusGraphData>;
}
