import { INexusRepository } from "@/application/interfaces/INexusRepository";
import { NexusGraphData } from "@/domain/entities/NexusGraph";

export class MockNexusRepository implements INexusRepository {
  private mockData: NexusGraphData = {
    nodes: [
      { id: "S1", label: "Vikram 'Viper' Singh", type: "suspect", riskScore: 95 },
      { id: "S2", label: "Rahul 'Reddy' Sharma", type: "suspect", riskScore: 78 },
      { id: "S3", label: "Priya 'Phantom' Das", type: "suspect", riskScore: 82 },
      { id: "S4", label: "Karan Johar", type: "suspect", riskScore: 45 },
      { id: "P1", label: "+91 98765 43210", type: "phone", riskScore: 88 },
      { id: "P2", label: "+91 99999 88888", type: "phone", riskScore: 72 },
      { id: "P3", label: "+91 88888 77777", type: "phone", riskScore: 40 },
      { id: "P4", label: "+91 77777 66666", type: "phone", riskScore: 65 },
      { id: "V1", label: "KA-01-MJ-9999 (Black SUV)", type: "vehicle", riskScore: 85 },
      { id: "V2", label: "KA-03-TR-4567 (White Sedan)", type: "vehicle", riskScore: 50 },
      { id: "V3", label: "DL-02-CP-1111 (Motorcycle)", type: "vehicle", riskScore: 60 },
      { id: "F1", label: "FIR 124/2026: Armed Robbery", type: "fir", riskScore: 90 },
      { id: "F2", label: "FIR 88/2026: Money Laundering", type: "fir", riskScore: 80 },
      { id: "F3", label: "FIR 210/2026: Narcotics Smuggling", type: "fir", riskScore: 95 },
      { id: "F4", label: "FIR 15/2026: Vehicle Theft", type: "fir", riskScore: 30 },
      { id: "F5", label: "FIR 340/2025: Extortion", type: "fir", riskScore: 75 }
    ],
    edges: [
      { source: "S1", target: "P1", relationship: "USED_BY" },
      { source: "S1", target: "V1", relationship: "OWNER_OF" },
      { source: "S1", target: "F1", relationship: "NAMED_IN" },
      { source: "S1", target: "F2", relationship: "NAMED_IN" },
      { source: "S1", target: "F3", relationship: "NAMED_IN" },
      { source: "S1", target: "S2", relationship: "CO_CONSPIRATOR" },
      { source: "S1", target: "S3", relationship: "CO_CONSPIRATOR" },
      { source: "S2", target: "P2", relationship: "USED_BY" },
      { source: "S2", target: "V2", relationship: "OWNER_OF" },
      { source: "S2", target: "F1", relationship: "NAMED_IN" },
      { source: "S2", target: "F5", relationship: "NAMED_IN" },
      { source: "S3", target: "P3", relationship: "USED_BY" },
      { source: "S3", target: "V1", relationship: "PASSENGER_IN" },
      { source: "S3", target: "F3", relationship: "NAMED_IN" },
      { source: "S3", target: "S4", relationship: "CONTACT_OF" },
      { source: "S4", target: "P4", relationship: "USED_BY" },
      { source: "S4", target: "V3", relationship: "OWNER_OF" },
      { source: "S4", target: "F4", relationship: "NAMED_IN" },
      { source: "P1", target: "P2", relationship: "COMMUNICATED_WITH" },
      { source: "P1", target: "P4", relationship: "COMMUNICATED_WITH" },
      { source: "P2", target: "P3", relationship: "COMMUNICATED_WITH" },
      { source: "V1", target: "F3", relationship: "SPOTTED_AT_SCENE" },
      { source: "V2", target: "F1", relationship: "GETAWAY_VEHICLE" }
    ]
  };

  async getGraphData(): Promise<NexusGraphData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          nodes: [...this.mockData.nodes],
          edges: [...this.mockData.edges]
        });
      }, 300);
    });
  }
}
