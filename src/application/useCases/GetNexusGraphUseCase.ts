import { INexusRepository } from "../interfaces/INexusRepository";
import { NexusGraphData } from "@/domain/entities/NexusGraph";

export class GetNexusGraphUseCase {
  constructor(private nexusRepository: INexusRepository) {}

  async execute(): Promise<NexusGraphData> {
    return this.nexusRepository.getGraphData();
  }
}
