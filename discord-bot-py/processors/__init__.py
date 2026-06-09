"""Processor package: API callers for the 5 Next.js endpoints."""
from processors.base import BaseProcessor
from processors.secretary import SecretaryProcessor
from processors.translator import TranslatorProcessor
from processors.analyst import AnalystProcessor
from processors.developer import DeveloperProcessor
from processors.planner import PlannerProcessor

__all__ = [
    "BaseProcessor",
    "SecretaryProcessor",
    "TranslatorProcessor",
    "AnalystProcessor",
    "DeveloperProcessor",
    "PlannerProcessor",
    "PROCESSOR_REGISTRY",
]

PROCESSOR_REGISTRY = {
    "secretary": SecretaryProcessor,
    "translator": TranslatorProcessor,
    "analyst": AnalystProcessor,
    "developer": DeveloperProcessor,
    "planner": PlannerProcessor,
}
